<script setup>
import { ref } from 'vue'

defineProps({
  isSignedIn: {
    type: Boolean,
    required: true,
  },
  activityNotificationsEnabled: {
    type: Boolean,
    required: true,
  },
  activityItems: {
    type: Array,
    required: true,
  },
  currentReadingItems: {
    type: Array,
    required: true,
  },
  notificationSupported: {
    type: Boolean,
    required: true,
  },
  notificationPermission: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['toggle-activity-notifications'])
const activeTab = ref('current')

function getActivityVerb(type) {
  if (type === 'finished') {
    return 'just finished'
  }

  return type === 'listening' ? 'is listening to' : 'is reading'
}

function formatOccurredAt(type, value) {
  const date = new Date(value)
  const today = new Date()
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (isSameDay) {
    if (type === 'finished') {
      return 'Finished today'
    }

    return type === 'listening' ? 'Started listening today' : 'Started today'
  }

  if (type === 'finished') {
    return `Finished ${date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`
  }

  if (type === 'listening') {
    return `Started listening ${date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`
  }

  return `Started ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`
}

function formatStartedAt(value, mode = 'reading') {
  const date = new Date(value)
  const today = new Date()
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (isSameDay) {
    return mode === 'listening' ? 'Started listening today' : 'Started today'
  }

  const prefix = mode === 'listening' ? 'Started listening' : 'Started'

  return `${prefix} ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`
}

function getCurrentStatus(item) {
  if (item.isCurrentlyReading) {
    return 'Currently reading'
  }

  if (item.isCurrentlyListening) {
    return 'Currently listening'
  }

  return 'Not reading right now'
}

function getCurrentKicker(item) {
  return item.currentMode === 'listening' ? 'Current audiobook' : 'Current book'
}

function handleToggle(event) {
  emit('toggle-activity-notifications', event.target.checked)
}
</script>

<template>
  <section class="panel">
    <div class="section-header">
      <div>
        <p class="eyebrow">Acticity</p>
        <h2>What everyone is reading</h2>
      </div>
    </div>

    <p v-if="!isSignedIn" class="status">
      Sign in to see what other readers are currently reading.
    </p>

    <section
      v-else
      class="activity-settings"
      :class="{ disabled: !notificationSupported }"
    >
      <div class="activity-settings-copy">
        <p class="activity-settings-title">Activity notifications</p>
        <p class="activity-settings-meta">
          {{
            notificationSupported
              ? notificationPermission === 'granted'
                ? 'Get a notification when someone starts reading, starts listening, or finishes a book.'
                : 'Turn this on to allow browser notifications for new reading activity.'
              : 'This browser does not support push notifications.'
          }}
        </p>
      </div>

      <label
        class="mini-toggle"
        :class="{ active: activityNotificationsEnabled, disabled: !notificationSupported }"
      >
        <input
          class="mini-toggle-input"
          type="checkbox"
          :checked="activityNotificationsEnabled"
          :disabled="!notificationSupported"
          @change="handleToggle"
        />
        <span class="mini-toggle-track" aria-hidden="true">
          <span class="mini-toggle-thumb"></span>
        </span>
        <span class="sr-only">Toggle activity notifications</span>
      </label>
    </section>

    <div v-if="isSignedIn" class="tab-row" role="tablist" aria-label="Activity views">
      <button
        class="tab-button"
        :class="{ active: activeTab === 'current' }"
        type="button"
        @click="activeTab = 'current'"
      >
        Currently Reading
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'activity' }"
        type="button"
        @click="activeTab = 'activity'"
      >
        Activity
      </button>
    </div>

    <div v-if="isSignedIn && activeTab === 'activity' && !activityItems.length" class="empty-state">
      <p class="auth-copy">
        No reading activity yet. New starts, listening updates, and finishes will show up here.
      </p>
    </div>

    <div v-else-if="isSignedIn && activeTab === 'activity'" class="activity-list">
      <article v-for="item in activityItems" :key="item.id" class="activity-card">
        <div class="activity-avatar-wrap">
          <img
            v-if="item.avatarUrl"
            class="activity-avatar"
            :src="item.avatarUrl"
            :alt="`${item.displayName} avatar`"
            referrerpolicy="no-referrer"
          />
          <div v-else class="activity-avatar fallback-avatar" aria-hidden="true">
            {{ item.firstName.charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="activity-copy">
          <p class="activity-title"><strong>{{ item.firstName }}</strong> {{ getActivityVerb(item.type) }}</p>
          <h3>{{ item.bookTitle }}</h3>
          <p class="activity-meta">Publication #{{ item.publicationOrder }}</p>
          <p class="activity-time">{{ formatOccurredAt(item.type, item.occurredAt) }}</p>
        </div>
      </article>
    </div>

    <div v-else-if="isSignedIn" class="current-reading-grid">
      <article
        v-for="item in currentReadingItems"
        :key="item.id"
        class="current-reading-card"
        :class="[{ idle: !item.hasCurrentActivity }, item.seriesSlug && `series-${item.seriesSlug}`]"
      >
        <div class="current-reading-card-top">
          <div class="current-reading-profile">
            <img
              v-if="item.avatarUrl"
              class="current-reading-avatar"
              :src="item.avatarUrl"
              :alt="`${item.displayName} avatar`"
              referrerpolicy="no-referrer"
            />
            <div v-else class="current-reading-avatar fallback-avatar" aria-hidden="true">
              {{ item.firstName.charAt(0).toUpperCase() }}
            </div>

            <div class="current-reading-profile-copy">
              <h3>{{ item.displayName }}</h3>
              <div class="current-reading-status-row">
                <p>{{ getCurrentStatus(item) }}</p>
                <span v-if="item.hasCurrentActivity" class="current-reading-mode-icons">
                  <span
                    v-if="item.isCurrentlyReading"
                    class="current-reading-mode-icon"
                    title="Reading"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                      <path
                        d="M4.75 5.5A2.75 2.75 0 0 1 7.5 2.75H20v15.5H7.5a2.75 2.75 0 0 0-2.75 2.75z"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                      />
                      <path
                        d="M7.5 2.75v18.25M10.5 7.25h5.5M10.5 10.75h5.5"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                      />
                    </svg>
                  </span>
                  <span
                    v-if="item.isCurrentlyListening"
                    class="current-reading-mode-icon"
                    title="Listening"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                      <path
                        d="M5.75 13.25v2.5a2 2 0 0 0 2 2h1.5v-5h-1.5a2 2 0 0 0-2 2zm9 0v5h1.5a2 2 0 0 0 2-2v-2.5a2 2 0 0 0-2-2zM8.75 12.75v-1.5a3.25 3.25 0 1 1 6.5 0v1.5"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                      />
                    </svg>
                  </span>
                  <span class="sr-only">
                    {{
                      item.isCurrentlyReading && item.isCurrentlyListening
                        ? 'Currently reading and listening'
                        : item.isCurrentlyListening
                          ? 'Currently listening'
                          : 'Currently reading'
                    }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="item.hasCurrentActivity" class="current-reading-book">
          <p class="current-reading-kicker">{{ getCurrentKicker(item) }}</p>
          <h4>{{ item.bookTitle }}</h4>

          <div class="current-reading-chip-row">
            <span class="current-reading-series-chip">
              <span class="current-reading-series-icon">{{ item.seriesShortLabel }}</span>
              <span>{{ item.seriesLabel }}</span>
            </span>
            <span class="current-reading-chip">{{ item.bookType }}</span>
            <span class="current-reading-chip">{{ item.planet }}</span>
            <span class="current-reading-chip">Publication #{{ item.publicationOrder }}</span>
          </div>

          <p class="current-reading-time">
            {{ formatStartedAt(item.startedAt, item.currentMode) }} · {{ item.durationLabel }}
          </p>

          <div v-if="item.additionalListeningBookTitle" class="current-reading-sidecar">
            <p class="current-reading-sidecar-label">Also listening to</p>
            <p class="current-reading-sidecar-title">{{ item.additionalListeningBookTitle }}</p>
            <p class="current-reading-sidecar-time">
              {{ formatStartedAt(item.additionalListeningStartedAt, 'listening') }}
            </p>
          </div>
        </div>

        <div v-else class="current-reading-idle-state">
          <span class="current-reading-idle-dot" aria-hidden="true"></span>
          <p class="current-reading-idle-copy">
            No book is marked as currently reading for this reader.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
