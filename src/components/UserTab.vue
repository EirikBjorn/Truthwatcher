<script setup>
import { computed } from 'vue'

const props = defineProps({
  isSignedIn: {
    type: Boolean,
    required: true,
  },
  currentUserAvatar: {
    type: String,
    default: '',
  },
  currentUserName: {
    type: String,
    required: true,
  },
  currentUserEmail: {
    type: String,
    default: '',
  },
  currentUserInitial: {
    type: String,
    required: true,
  },
  authBusy: {
    type: Boolean,
    required: true,
  },
  authLoading: {
    type: Boolean,
    required: true,
  },
  notificationPermission: {
    type: String,
    required: true,
  },
  cosmereProgress: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['sign-in', 'sign-out', 'enable-notifications'])

const progressCircumference = 2 * Math.PI * 52
const progressDashOffset = computed(
  () => progressCircumference * (1 - props.cosmereProgress.percentComplete / 100),
)

function formatHours(value) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

function handleSignIn() {
  emit('sign-in')
}

function handleSignOut() {
  emit('sign-out')
}

function handleEnableNotifications() {
  emit('enable-notifications')
}
</script>

<template>
  <section class="panel home-panel">
    <div class="home-progress-stage">
      <section class="progress-card-shell">
        <p class="eyebrow progress-eyebrow">Cosmere Progress</p>
        <div class="cosmere-progress-card">
          <div class="progress-ring-wrap">
            <svg class="progress-ring" viewBox="0 0 140 140" aria-hidden="true">
              <defs>
                <linearGradient id="cosmere-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#21453c" />
                  <stop offset="100%" stop-color="#8dad8f" />
                </linearGradient>
              </defs>
              <circle class="progress-ring-track" cx="70" cy="70" r="52" />
              <circle
                class="progress-ring-value"
                cx="70"
                cy="70"
                r="52"
                :stroke-dasharray="progressCircumference"
                :stroke-dashoffset="progressDashOffset"
              />
            </svg>
            <div class="progress-ring-copy">
              <span class="progress-ring-value-text">{{ cosmereProgress.percentComplete }}%</span>
              <span class="progress-ring-caption">complete</span>
            </div>
          </div>

          <div class="cosmere-progress-copy">
            <h3>{{ isSignedIn ? 'Your journey through the Cosmere' : 'Sign in to track your journey' }}</h3>
            <p class="auth-copy">
              {{
                isSignedIn
                  ? `${formatHours(cosmereProgress.completedHours)} of ${formatHours(cosmereProgress.totalHours)} hours completed`
                  : `Track ${formatHours(cosmereProgress.totalHours)} hours across ${cosmereProgress.totalBooks} books`
              }}
            </p>

            <div class="progress-stat-grid">
              <div class="progress-stat">
                <span class="progress-stat-label">Books read</span>
                <strong>{{ cosmereProgress.completedBooks }}/{{ cosmereProgress.totalBooks }}</strong>
              </div>
              <div class="progress-stat">
                <span class="progress-stat-label">Worlds visited</span>
                <strong>{{ cosmereProgress.completedPlanets }}/{{ cosmereProgress.totalPlanets }}</strong>
              </div>
              <div class="progress-stat">
                <span class="progress-stat-label">Novels read</span>
                <strong>{{ cosmereProgress.completedNovels }}/{{ cosmereProgress.totalNovels }}</strong>
              </div>
              <div class="progress-stat">
                <span class="progress-stat-label">Novellas read</span>
                <strong>{{ cosmereProgress.completedNovellas }}/{{ cosmereProgress.totalNovellas }}</strong>
              </div>
              <div class="progress-stat">
                <span class="progress-stat-label">Short stories read</span>
                <strong>
                  {{ cosmereProgress.completedShortStories }}/{{ cosmereProgress.totalShortStories }}
                </strong>
              </div>
              <div class="progress-stat">
                <span class="progress-stat-label">Hours left</span>
                <strong>{{ formatHours(cosmereProgress.remainingHours) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="home-bottom-stack">
      <section class="settings-card" :class="{ 'settings-card-enabled': notificationPermission === 'granted' }">
        <p class="eyebrow">Notifications</p>
        <template v-if="notificationPermission === 'granted'">
          <p class="settings-success">Notifications enabled</p>
          <p class="auth-copy">You will receive progress and activity updates on this device.</p>
        </template>
        <template v-else>
          <p class="auth-copy">
            Enable notifications to follow writing progress updates for specific projects.
          </p>
          <button class="secondary-button settings-button" @click="handleEnableNotifications">
            Enable notifications
          </button>
        </template>
      </section>

      <div v-if="isSignedIn" class="profile-card">
        <div class="profile-header">
          <img
            v-if="currentUserAvatar"
            class="profile-avatar"
            :src="currentUserAvatar"
            :alt="`${currentUserName} profile picture`"
            referrerpolicy="no-referrer"
          />
          <div v-else class="profile-avatar fallback-avatar" aria-hidden="true">
            {{ currentUserInitial }}
          </div>

          <div class="profile-copy">
            <h3>{{ currentUserName }}</h3>
            <p>{{ currentUserEmail }}</p>
          </div>
        </div>

        <button class="primary-button profile-signout" :disabled="authBusy" @click="handleSignOut">
          {{ authBusy ? 'Signing out…' : 'Sign out' }}
        </button>
      </div>

      <div v-else class="empty-state">
        <p class="auth-copy">Sign in with Google to save your checklist and progress.</p>
        <button class="primary-button" :disabled="authLoading || authBusy" @click="handleSignIn">
          {{ authLoading ? 'Checking session…' : authBusy ? 'Redirecting…' : 'Sign in with Google' }}
        </button>
      </div>
    </div>
  </section>
</template>
