<script setup>
import { computed } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    required: true,
  },
  profile: {
    type: Object,
    default: null,
  },
  cosmereProgress: {
    type: Object,
    required: true,
  },
  currentReading: {
    type: Object,
    default: null,
  },
  currentListening: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['back'])

const progressCircumference = 2 * Math.PI * 52
const progressDashOffset = computed(
  () => progressCircumference * (1 - props.cosmereProgress.percentComplete / 100),
)
const currentItems = computed(() => [props.currentReading, props.currentListening].filter(Boolean))
const profileInitial = computed(
  () => props.profile?.displayName?.trim().charAt(0).toUpperCase() || 'U',
)
const profileSummary = computed(() => {
  if (!props.profile) {
    return ''
  }

  const booksLabel = `${props.cosmereProgress.completedBooks} of ${props.cosmereProgress.totalBooks} books complete`
  const worldsLabel = `${props.cosmereProgress.completedPlanets} worlds visited`

  return `${booksLabel} · ${worldsLabel}`
})

function formatHours(value) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

function formatStartedAt(value, mode = 'reading') {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const today = new Date()
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (isSameDay) {
    return mode === 'listening' ? 'Started listening today' : 'Started reading today'
  }

  return `${mode === 'listening' ? 'Started listening' : 'Started reading'} ${date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    },
  )}`
}

function getModeLabel(mode) {
  return mode === 'listening' ? 'Currently listening' : 'Currently reading'
}

function handleBack() {
  emit('back')
}
</script>

<template>
  <section class="profile-page">
    <button class="secondary-button profile-back-button" type="button" @click="handleBack">
      Back to activity
    </button>

    <section v-if="loading" class="panel">
      <p class="status">Loading profile…</p>
    </section>

    <section v-else-if="profile" class="panel profile-summary-card">
      <div class="profile-mini-header">
        <img
          v-if="profile.avatarUrl"
          class="profile-mini-avatar"
          :src="profile.avatarUrl"
          :alt="`${profile.displayName} profile picture`"
          referrerpolicy="no-referrer"
        />
        <div v-else class="profile-mini-avatar fallback-avatar" aria-hidden="true">
          {{ profileInitial }}
        </div>

        <div class="profile-mini-copy">
          <p class="eyebrow">Reader Profile</p>
          <h1>{{ profile.displayName }}</h1>
          <p>{{ profileSummary }}</p>
        </div>
      </div>

      <div class="progress-card-shell profile-progress-shell">
          <p class="eyebrow progress-eyebrow">Cosmere Progress</p>
          <div class="cosmere-progress-card">
            <div class="progress-ring-wrap">
              <svg class="progress-ring" viewBox="0 0 140 140" aria-hidden="true">
                <defs>
                  <linearGradient id="profile-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#21453c" />
                    <stop offset="100%" stop-color="#8dad8f" />
                  </linearGradient>
                </defs>
                <circle class="progress-ring-track" cx="70" cy="70" r="52" />
                <circle
                  class="progress-ring-value profile-progress-ring-value"
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
              <h3>{{ profile.displayName }}'s journey through the Cosmere</h3>
              <p class="auth-copy">
                {{ formatHours(cosmereProgress.completedHours) }} of
                {{ formatHours(cosmereProgress.totalHours) }} hours completed
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

          <section class="profile-current-section">
            <div v-if="currentItems.length" class="profile-current-grid">
              <article
                v-for="item in currentItems"
                :key="`${profile.id}-${item.mode}`"
                class="profile-current-item"
                :class="[
                  item.seriesSlug && `series-${item.seriesSlug}`,
                  item.themeSlug && `theme-${item.themeSlug}`,
                ]"
              >
                <div class="profile-current-card-top">
                  <div class="profile-current-mode-pill">
                    {{ getModeLabel(item.mode) }}
                  </div>
                  <p class="current-reading-time">{{ formatStartedAt(item.startedAt, item.mode) }}</p>
                </div>

                <div class="current-reading-book">
                  <p class="current-reading-kicker">{{ item.mode === 'listening' ? 'Audiobook' : 'Book' }}</p>
                  <h4>{{ item.title }}</h4>

                  <div class="current-reading-chip-row">
                    <span class="current-reading-series-chip">
                      <span class="current-reading-series-icon">{{ item.shortLabel }}</span>
                      <span>{{ item.label }}</span>
                    </span>
                    <span class="current-reading-chip">{{ item.type }}</span>
                    <span class="current-reading-chip">{{ item.planet }}</span>
                    <span class="current-reading-chip">Publication #{{ item.publicationOrder }}</span>
                  </div>

                  <p class="current-reading-time">{{ item.durationLabel }}</p>
                </div>
              </article>
            </div>

            <div v-else class="current-reading-idle-state profile-current-empty">
              <span class="current-reading-idle-dot" aria-hidden="true"></span>
              <p class="current-reading-idle-copy">
                This reader does not have a current book or audiobook marked right now.
              </p>
            </div>
          </section>
        </div>
    </section>

    <section v-else class="panel">
      <p class="status">This profile is not available.</p>
    </section>
  </section>
</template>
