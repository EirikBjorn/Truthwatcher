<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  fetchLatestProgress,
  fetchProjectSubscriptions,
  saveProjectSubscription,
  savePushSubscription,
} from './lib/api'
import { storageKeyPrefix } from './lib/app-env'
import { CHECKLIST_TABS, PLANET_ORDER } from './lib/books'
import { getReadingList, toggleReadingItem } from './lib/db'

const progressItems = ref([])
const readingList = ref([])
const loading = ref(true)
const errorMessage = ref('')
const checklistTabStorageKey = `${storageKeyPrefix}.checklistTab`
const appTabStorageKey = `${storageKeyPrefix}.appTab`
const notificationPermission = ref(
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
)
const currentSubscription = ref(null)
const subscriptionMap = ref({})
const activeChecklistTab = ref('publication')
const activeAppTab = ref('tracker')
const appTabs = [
  { id: 'tracker', label: 'Tracker' },
  { id: 'list', label: 'List' },
]

const completedBooks = computed(() =>
  readingList.value.filter((item) => item.completed).length,
)

const checklistSections = computed(() => {
  if (activeChecklistTab.value === 'planet') {
    return PLANET_ORDER
      .map((planet) => ({
        id: planet,
        title: planet,
        items: readingList.value
          .filter((item) => item.planet === planet)
          .sort((left, right) => left.publicationOrder - right.publicationOrder),
      }))
      .filter((section) => section.items.length)
  }

  const sortField = activeChecklistTab.value === 'eirik' ? 'eirikOrder' : 'publicationOrder'
  const title = activeChecklistTab.value === 'eirik' ? "Eirik's Order" : 'Publication Order'

  return [
    {
      id: activeChecklistTab.value,
      title,
      items: [...readingList.value].sort((left, right) => left[sortField] - right[sortField]),
    },
  ]
})

const notificationSupported =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

onMounted(async () => {
  try {
    const savedChecklistTab = readSavedChecklistTab()
    const savedAppTab = readSavedAppTab()

    if (savedChecklistTab) {
      activeChecklistTab.value = savedChecklistTab
    }

    if (savedAppTab) {
      activeAppTab.value = savedAppTab
    }

    await Promise.all([loadProgress(), loadReadingList(), hydratePushState()])
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
})

async function loadProgress() {
  try {
    progressItems.value = await fetchLatestProgress()
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function loadReadingList() {
  readingList.value = await getReadingList()
}

async function hydratePushState() {
  if (!notificationSupported) {
    return
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    return
  }

  currentSubscription.value = subscription.toJSON()
  const projectSlugs = await fetchProjectSubscriptions(currentSubscription.value.endpoint)
  subscriptionMap.value = Object.fromEntries(projectSlugs.map((slug) => [slug, true]))
}

async function enableNotifications() {
  try {
    if (!notificationSupported) {
      errorMessage.value = 'Push notifications are not supported in this browser.'
      return
    }

    const permission = await Notification.requestPermission()
    notificationPermission.value = permission

    if (permission !== 'granted') {
      return
    }

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        throw new Error('Missing VITE_VAPID_PUBLIC_KEY.')
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
    }

    currentSubscription.value = subscription.toJSON()
    await savePushSubscription(currentSubscription.value)
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function toggleProject(projectSlug, enabled) {
  try {
    subscriptionMap.value = {
      ...subscriptionMap.value,
      [projectSlug]: enabled,
    }

    if (!currentSubscription.value) {
      return
    }

    await saveProjectSubscription({
      projectSlug,
      enabled,
      subscription: currentSubscription.value,
    })
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function toggleBook(id) {
  const updated = await toggleReadingItem(id)
  readingList.value = readingList.value.map((item) => (item.id === id ? updated : item))
}

function readSavedChecklistTab() {
  try {
    const savedValue = window.localStorage.getItem(checklistTabStorageKey)
    const validTabIds = new Set(CHECKLIST_TABS.map((tab) => tab.id))

    return validTabIds.has(savedValue) ? savedValue : null
  } catch {
    return null
  }
}

function readSavedAppTab() {
  try {
    const savedValue = window.localStorage.getItem(appTabStorageKey)
    const validTabIds = new Set(appTabs.map((tab) => tab.id))

    return validTabIds.has(savedValue) ? savedValue : null
  } catch {
    return null
  }
}

function formatChecklistMeta(book) {
  if (activeChecklistTab.value === 'planet') {
    return `${book.type} · Publication #${book.publicationOrder}`
  }

  if (activeChecklistTab.value === 'eirik') {
    return `${book.type} · ${book.durationLabel} · ${book.planet}`
  }

  return `${book.type} · ${book.planet}`
}

function urlBase64ToUint8Array(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const raw = atob(padded)

  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

watch(activeChecklistTab, (value) => {
  try {
    window.localStorage.setItem(checklistTabStorageKey, value)
  } catch {
    // Ignore storage failures and keep the in-memory selection.
  }
})

watch(activeAppTab, (value) => {
  try {
    window.localStorage.setItem(appTabStorageKey, value)
  } catch {
    // Ignore storage failures and keep the in-memory selection.
  }
})
</script>

<template>
  <main class="app-shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Truthwatcher</p>
        <h1>The Cosmere progress tracker</h1>
        <p class="eyebrow">
          and the cosmere reading checklist
        </p>
      </div>

      <button
        class="primary-button"
        :disabled="notificationPermission === 'granted'"
        @click="enableNotifications"
      >
        {{ notificationPermission === 'granted' ? 'Notifications enabled' : 'Enable notifications' }}
      </button>
    </section>

    <p v-if="errorMessage" class="status error">{{ errorMessage }}</p>
    <p v-else-if="loading" class="status">Loading…</p>

    <section v-if="activeAppTab === 'tracker'" class="panel">
      <div class="section-header">
        <div>
          <p class="eyebrow">Writing Progress</p>
          <h2>Current projects</h2>
        </div>
      </div>

      <div class="progress-grid">
        <article
          v-for="item in progressItems"
          :key="item.project_slug"
          class="progress-card"
          :class="{ completed: item.progress === 100 }"
        >
          <div class="progress-heading">
            <div class="progress-copy">
              <h3>{{ item.project }}</h3>
              <p>{{ item.progress }}% complete</p>
            </div>
            <span v-if="item.progress === 100" class="completion-pill">Complete</span>
          </div>

          <div class="progress-bar" aria-hidden="true">
            <span :style="{ width: `${item.progress}%` }" />
          </div>

          <label class="toggle">
            <input
              type="checkbox"
              :checked="Boolean(subscriptionMap[item.project_slug])"
              :disabled="notificationPermission !== 'granted'"
              @change="toggleProject(item.project_slug, $event.target.checked)"
            />
            <span class="toggle-label">Notify me about {{ item.project }}</span>
          </label>
        </article>
      </div>
    </section>

    <section v-else class="panel">
      <div class="section-header">
        <div>
          <p class="eyebrow">Reading Checklist</p>
          <h2>{{ completedBooks }}/{{ readingList.length }} completed</h2>
        </div>
      </div>

      <div class="tab-row" role="tablist" aria-label="Checklist order">
        <button
          v-for="tab in CHECKLIST_TABS"
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeChecklistTab === tab.id }"
          type="button"
          @click="activeChecklistTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="checklist-sections">
        <section v-for="section in checklistSections" :key="section.id" class="checklist-section">
          <h3 class="checklist-heading">{{ section.title }}</h3>

          <div class="checklist">
            <label v-for="book in section.items" :key="book.id" class="checklist-item">
              <input type="checkbox" :checked="book.completed" @change="toggleBook(book.id)" />
              <span class="checklist-copy">
                <span>{{ book.title }}</span>
                <span class="checklist-meta">{{ formatChecklistMeta(book) }}</span>
              </span>
            </label>
          </div>
        </section>
      </div>
    </section>

    <nav class="bottom-nav" aria-label="Main navigation">
      <button
        v-for="tab in appTabs"
        :key="tab.id"
        class="bottom-nav-button"
        :class="{ active: activeAppTab === tab.id }"
        type="button"
        @click="activeAppTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>
  </main>
</template>
