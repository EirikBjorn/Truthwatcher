<script setup>
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

    <div v-if="isSignedIn && !activityItems.length" class="empty-state">
      <p class="auth-copy">No reading activity yet. New starts and finishes will show up here.</p>
    </div>

    <div v-else-if="isSignedIn" class="activity-list">
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
  </section>
</template>
