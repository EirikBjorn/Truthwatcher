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
const activeTab = ref('activity')

function getActivityVerb(type) {
  return type === 'finished' ? 'just finished' : 'is reading'
}

function formatOccurredAt(type, value) {
  const date = new Date(value)
  const today = new Date()
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (isSameDay) {
    return type === 'finished' ? 'Finished today' : 'Started today'
  }

  return `${type === 'finished' ? 'Finished' : 'Started'} ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`
}

function formatStartedAt(value) {
  const date = new Date(value)
  const today = new Date()
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (isSameDay) {
    return 'Started today'
  }

  return `Started ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`
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
                ? 'Get a notification when someone starts or finishes a book.'
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
        :class="{ active: activeTab === 'activity' }"
        type="button"
        @click="activeTab = 'activity'"
      >
        Activity
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'current' }"
        type="button"
        @click="activeTab = 'current'"
      >
        Currently Reading
      </button>
    </div>

    <div v-if="isSignedIn && activeTab === 'activity' && !activityItems.length" class="empty-state">
      <p class="auth-copy">No reading activity yet. New starts and finishes will show up here.</p>
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
        :class="[{ idle: !item.isCurrentlyReading }, item.seriesSlug && `series-${item.seriesSlug}`]"
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
              <p>{{ item.isCurrentlyReading ? 'Currently reading' : 'Not reading right now' }}</p>
            </div>
          </div>
        </div>

        <div v-if="item.isCurrentlyReading" class="current-reading-book">
          <p class="current-reading-kicker">Current book</p>
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
            {{ formatStartedAt(item.startedAt) }} · {{ item.durationLabel }}
          </p>
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
