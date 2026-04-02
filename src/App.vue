<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  fetchCurrentProfile,
  fetchLatestProgress,
  fetchProjectSubscriptions,
  fetchReadingActivity,
  saveProjectSubscription,
  saveActivityNotificationsPreference,
  savePushSubscription,
  syncCurrentProfile,
} from './lib/api'
import { storageKeyPrefix } from './lib/app-env'
import { CHECKLIST_TABS, PLANET_ORDER, calculateCosmereProgress } from './lib/books'
import ActivityTab from './components/ActivityTab.vue'
import ReadingListTab from './components/ReadingListTab.vue'
import {
  getReadingList,
  setReadingItemCompleted,
  setReadingItemCurrentState,
} from './lib/db'
import TrackerTab from './components/TrackerTab.vue'
import UserTab from './components/UserTab.vue'
import { signInWithGoogle, signOut, supabase } from './lib/supabase'

const progressItems = ref([])
const readingList = ref([])
const activityItems = ref([])
const loading = ref(true)
const errorMessage = ref('')
const authLoading = ref(true)
const authBusy = ref(false)
const currentUser = ref(null)
const checklistTabStorageKey = `${storageKeyPrefix}.checklistTab`
const appTabStorageKey = `${storageKeyPrefix}.appTab`
const notificationPermission = ref(
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
)
const activityNotificationsEnabled = ref(false)
const currentSubscription = ref(null)
const subscriptionMap = ref({})
const activeChecklistTab = ref('eirik')
const activeAppTab = ref('home')
const appTabs = [
  { id: 'home', label: 'Home' },
  { id: 'list', label: 'List' },
  { id: 'activity', label: 'Acticity' },
  { id: 'tracker', label: 'Tracker' },
]

const completedBooks = computed(() =>
  readingList.value.filter((item) => item.completed).length,
)
const cosmereProgress = computed(() => calculateCosmereProgress(readingList.value))
const isSignedIn = computed(() => Boolean(currentUser.value))
const currentUserName = computed(() => {
  const metadata = currentUser.value?.user_metadata ?? {}

  return (
    metadata.full_name ||
    metadata.name ||
    currentUser.value?.email?.split('@')[0] ||
    'Truthwatcher User'
  )
})
const currentUserEmail = computed(() => currentUser.value?.email || '')
const currentUserAvatar = computed(() => {
  const metadata = currentUser.value?.user_metadata ?? {}

  return metadata.avatar_url || metadata.picture || ''
})
const currentUserInitial = computed(() => currentUserName.value.trim().charAt(0).toUpperCase() || 'U')

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
      .map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          meta: formatChecklistMeta(item),
        })),
      }))
  }

  const sortField = activeChecklistTab.value === 'eirik' ? 'eirikOrder' : 'publicationOrder'
  const title = activeChecklistTab.value === 'eirik' ? 'Reading Order' : 'Publication Order'

  return [
    {
      id: activeChecklistTab.value,
      title,
      items: [...readingList.value]
        .sort((left, right) => left[sortField] - right[sortField])
        .map((item) => ({
          ...item,
          meta: formatChecklistMeta(item),
        })),
    },
  ]
})

const notificationSupported =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

let authStateSubscription = null

onMounted(async () => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    currentUser.value = session?.user ?? null
    authLoading.value = false
    if (session?.user) {
      void syncCurrentProfile(session.user)
      if (currentSubscription.value) {
        void savePushSubscription(currentSubscription.value)
      }
    }
    void loadReadingList(currentUser.value)
    void loadActivityItems(currentUser.value)
    void loadProjectSubscriptionMap(currentUser.value)
    void loadActivityNotificationPreference(currentUser.value)
  })

  authStateSubscription = data.subscription

  try {
    const savedChecklistTab = readSavedChecklistTab()
    const savedAppTab = readSavedAppTab()

    if (savedChecklistTab) {
      activeChecklistTab.value = savedChecklistTab
    }

    if (savedAppTab) {
      activeAppTab.value = savedAppTab
    }

    await hydrateAuthState()
    await Promise.all([
      loadProgress(),
      loadReadingList(),
      loadActivityItems(),
      hydratePushState(),
      loadProjectSubscriptionMap(),
      loadActivityNotificationPreference(),
    ])
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  authStateSubscription?.unsubscribe()
})

async function hydrateAuthState() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  currentUser.value = session?.user ?? null
  authLoading.value = false
}

async function loadProgress() {
  try {
    progressItems.value = await fetchLatestProgress()
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function loadReadingList(user = currentUser.value) {
  readingList.value = await getReadingList(user)
}

async function loadActivityItems(user = currentUser.value) {
  if (!user) {
    activityItems.value = []
    return
  }

  activityItems.value = await fetchReadingActivity(20)
}

async function loadProjectSubscriptionMap(user = currentUser.value) {
  if (!user?.id) {
    subscriptionMap.value = {}
    return
  }

  try {
    const projectSlugs = await fetchProjectSubscriptions(user.id)
    subscriptionMap.value = Object.fromEntries(projectSlugs.map((slug) => [slug, true]))
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function loadActivityNotificationPreference(user = currentUser.value) {
  if (!user?.id) {
    activityNotificationsEnabled.value = false
    return
  }

  try {
    const profile = await fetchCurrentProfile(user.id)
    activityNotificationsEnabled.value = Boolean(profile?.activityNotificationsEnabled)
  } catch (error) {
    errorMessage.value = error.message
  }
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
  if (currentUser.value) {
    await savePushSubscription(currentSubscription.value)
  }
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

async function toggleActivityNotifications(enabled) {
  if (!currentUser.value) {
    return
  }

  try {
    errorMessage.value = ''

    if (enabled && notificationPermission.value !== 'granted') {
      await enableNotifications()

      if (notificationPermission.value !== 'granted') {
        return
      }
    }

    if (currentSubscription.value) {
      await savePushSubscription(currentSubscription.value)
    }

    await saveActivityNotificationsPreference({
      user: currentUser.value,
      enabled,
    })
    activityNotificationsEnabled.value = enabled
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function startGoogleSignIn() {
  try {
    errorMessage.value = ''
    authBusy.value = true
    await signInWithGoogle()
  } catch (error) {
    errorMessage.value = error.message
    authBusy.value = false
  }
}

async function handleSignOut() {
  try {
    errorMessage.value = ''
    authBusy.value = true
    await signOut()
    activeAppTab.value = 'home'
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    authBusy.value = false
  }
}

async function toggleProject(projectSlug, enabled) {
  try {
    if (!currentUser.value) {
      errorMessage.value = 'Sign in to manage writing progress notifications.'
      return
    }

    if (enabled && notificationPermission.value !== 'granted') {
      await enableNotifications()

      if (notificationPermission.value !== 'granted') {
        return
      }
    }

    subscriptionMap.value = {
      ...subscriptionMap.value,
      [projectSlug]: enabled,
    }

    if (currentSubscription.value) {
      await savePushSubscription(currentSubscription.value)
    }

    await saveProjectSubscription({
      projectSlug,
      enabled,
    })
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function toggleBook(id) {
  const existingItem = readingList.value.find((item) => item.id === id)

  if (!existingItem || !currentUser.value) {
    return
  }

  await setReadingItemCompleted({
    id,
    completed: !existingItem.completed,
    user: currentUser.value,
  })
  if (!existingItem.completed && existingItem.isCurrentlyReading) {
    await setReadingItemCurrentState({
      id,
      reading: false,
      user: currentUser.value,
    })
  }
  await loadReadingList(currentUser.value)
  await loadActivityItems(currentUser.value)
}

async function toggleCurrentReading(id) {
  const existingItem = readingList.value.find((item) => item.id === id)

  if (!existingItem || !currentUser.value || existingItem.completed) {
    return
  }

  await setReadingItemCurrentState({
    id,
    reading: !existingItem.isCurrentlyReading,
    user: currentUser.value,
  })
  await loadReadingList(currentUser.value)
  await loadActivityItems(currentUser.value)
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
    <p v-if="errorMessage" class="status error">{{ errorMessage }}</p>
    <p v-else-if="loading" class="status">Loading…</p>

    <UserTab
      v-if="activeAppTab === 'home'"
      :is-signed-in="isSignedIn"
      :current-user-avatar="currentUserAvatar"
      :current-user-name="currentUserName"
      :current-user-email="currentUserEmail"
      :current-user-initial="currentUserInitial"
      :auth-busy="authBusy"
      :auth-loading="authLoading"
      :notification-permission="notificationPermission"
      :cosmere-progress="cosmereProgress"
      @sign-in="startGoogleSignIn"
      @sign-out="handleSignOut"
      @enable-notifications="enableNotifications"
    />

    <ReadingListTab
      v-else-if="activeAppTab === 'list'"
      :completed-books="completedBooks"
      :reading-list-length="readingList.length"
      :is-signed-in="isSignedIn"
      :active-checklist-tab="activeChecklistTab"
      :checklist-sections="checklistSections"
      @update:active-checklist-tab="activeChecklistTab = $event"
      @toggle-book="toggleBook"
      @toggle-current-reading="toggleCurrentReading"
    />

    <ActivityTab
      v-else-if="activeAppTab === 'activity'"
      :is-signed-in="isSignedIn"
      :activity-items="activityItems"
      :activity-notifications-enabled="activityNotificationsEnabled"
      :notification-supported="notificationSupported"
      :notification-permission="notificationPermission"
      @toggle-activity-notifications="toggleActivityNotifications"
    />

    <TrackerTab
      v-else
      :progress-items="progressItems"
      :subscription-map="subscriptionMap"
      :is-signed-in="isSignedIn"
      :notification-permission="notificationPermission"
      @toggle-project="toggleProject($event.projectSlug, $event.enabled)"
    />

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
