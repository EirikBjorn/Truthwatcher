<script setup>
import { computed, ref } from 'vue'
import { getWorkById } from '../lib/books'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  meta: {
    type: String,
    required: true,
  },
  showReadingInfo: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle', 'toggle-current-reading', 'toggle-current-listening'])

const visibleReaders = computed(() => props.item.readers?.slice(0, 4) ?? [])
const extraReaderCount = computed(() => Math.max((props.item.readers?.length ?? 0) - 4, 0))
const isReadingInfoOpen = ref(false)
const readingLabel = computed(() => props.item.readingLabel ?? '')
const hasReadingInfo = computed(() => props.showReadingInfo && Boolean(readingLabel.value))
const readingLabelText = computed(() => {
  if (!readingLabel.value) {
    return ''
  }

  return readingLabel.value.charAt(0).toUpperCase() + readingLabel.value.slice(1)
})
const prerequisiteTitles = computed(() =>
  (props.item.prerequisites ?? []).map((workId) => getWorkById(workId)?.title ?? workId),
)
const readingInfoTitleId = computed(() => `${props.item.id}-reading-info-title`)

function formatStartedLabel(value, mode) {
  if (!value) {
    return ''
  }

  const startedDate = new Date(value)
  const today = new Date()
  const isSameDay =
    startedDate.getFullYear() === today.getFullYear() &&
    startedDate.getMonth() === today.getMonth() &&
    startedDate.getDate() === today.getDate()

  if (isSameDay) {
    return mode === 'listening' ? 'Started listening today' : 'Started today'
  }

  const prefix = mode === 'listening' ? 'Started listening' : 'Started'

  return `${prefix} ${startedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`
}

const startedReadingLabel = computed(() =>
  formatStartedLabel(props.item.startedReadingAt, 'reading'),
)
const startedListeningLabel = computed(() =>
  formatStartedLabel(props.item.startedListeningAt, 'listening'),
)

function handleToggle() {
  emit('toggle', props.item.id)
}

function handleCurrentReadingToggle() {
  emit('toggle-current-reading', props.item.id)
}

function handleCurrentListeningToggle() {
  emit('toggle-current-listening', props.item.id)
}

function openReadingInfo() {
  isReadingInfoOpen.value = true
}

function closeReadingInfo() {
  isReadingInfoOpen.value = false
}
</script>

<template>
  <div
    class="checklist-item"
    :class="[
      `series-${item.slug}`,
      item.themeSlug && `theme-${item.themeSlug}`,
      {
        completed: item.completed,
        unreleased: !item.isReleased,
        'has-reading-info': hasReadingInfo,
      },
    ]"
  >
    <button
      v-if="hasReadingInfo"
      class="checklist-info-button"
      :class="`reading-label-${readingLabel}`"
      type="button"
      :aria-label="`Show ${readingLabelText} note for ${item.title}`"
      @click="openReadingInfo"
    >
      {{ readingLabelText }}
      <img class="checklist-info-icon" src="/icons/info.png" alt="" aria-hidden="true" />
    </button>

    <input
      class="checklist-checkbox"
      type="checkbox"
      :checked="item.completed"
      :disabled="disabled || !item.isReleased"
      :aria-label="`Mark ${item.title} as read`"
      @change="handleToggle"
    />
    <span class="checklist-copy">
      <span class="checklist-series-chip" :class="`series-${item.slug}`">
        <span class="checklist-series-icon" aria-hidden="true">{{ item.shortLabel }}</span>
        <span>{{ item.label }}</span>
      </span>
      <span class="checklist-title">{{ item.title }}</span>
      <span v-if="!item.isReleased" class="checklist-status-pill">Unreleased</span>
      <span class="checklist-meta">{{ meta }}</span>
      <span v-if="item.readers?.length" class="checklist-footer">
        <span class="checklist-readers-label">Read by</span>
        <span class="checklist-readers">
          <span
            v-for="reader in visibleReaders"
            :key="reader.id"
            class="reader-avatar"
            :title="reader.displayName"
          >
            <img
              v-if="reader.avatarUrl"
              class="reader-avatar-image"
              :src="reader.avatarUrl"
              :alt="`${reader.displayName} avatar`"
              referrerpolicy="no-referrer"
            />
            <span v-else class="reader-avatar-fallback" aria-hidden="true">{{ reader.initial }}</span>
          </span>
          <span v-if="extraReaderCount" class="reader-avatar reader-avatar-overflow">
            +{{ extraReaderCount }}
          </span>
        </span>
      </span>
      <span class="checklist-reading-state">
        <label
          class="reading-state-toggle"
          :class="{ active: item.isCurrentlyReading, disabled: disabled || !item.isReleased }"
        >
          <input
            class="reading-state-checkbox"
            type="checkbox"
            :checked="item.isCurrentlyReading"
            :disabled="disabled || !item.isReleased"
            :aria-label="`Mark ${item.title} as currently reading`"
            @change="handleCurrentReadingToggle"
          />
          <span class="reading-state-indicator" aria-hidden="true"></span>
          <span class="reading-state-copy">
            <span class="reading-state-label">Currently reading</span>
            <span
              v-if="item.isCurrentlyReading && startedReadingLabel"
              class="reading-state-meta"
            >
              {{ startedReadingLabel }}
            </span>
          </span>
        </label>

        <label
          class="reading-state-toggle"
          :class="{ active: item.isCurrentlyListening, disabled: disabled || !item.isReleased }"
        >
          <input
            class="reading-state-checkbox"
            type="checkbox"
            :checked="item.isCurrentlyListening"
            :disabled="disabled || !item.isReleased"
            :aria-label="`Mark ${item.title} as currently listening`"
            @change="handleCurrentListeningToggle"
          />
          <span class="reading-state-indicator" aria-hidden="true"></span>
          <span class="reading-state-copy">
            <span class="reading-state-label">Currently listening</span>
            <span
              v-if="item.isCurrentlyListening && startedListeningLabel"
              class="reading-state-meta"
            >
              {{ startedListeningLabel }}
            </span>
          </span>
        </label>
      </span>
    </span>
  </div>

  <Teleport to="body">
    <div
      v-if="isReadingInfoOpen"
      class="reading-info-backdrop"
      role="presentation"
      @click.self="closeReadingInfo"
      @keydown.esc="closeReadingInfo"
    >
      <section
        class="reading-info-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="readingInfoTitleId"
      >
        <button
          class="reading-info-close"
          type="button"
          aria-label="Close reading note"
          autofocus
          @click="closeReadingInfo"
        >
          X
        </button>

        <div class="reading-info-header">
          <span class="reading-info-label" :class="`reading-label-${readingLabel}`">
            {{ readingLabelText }}
          </span>
          <h3 :id="readingInfoTitleId">{{ item.title }}</h3>
        </div>

        <div class="reading-info-body">
          <div>
            <p class="reading-info-kicker">Note</p>
            <p>{{ item.note || 'No note added yet.' }}</p>
          </div>

          <div>
            <p class="reading-info-kicker">Prerequisites</p>
            <ul v-if="prerequisiteTitles.length" class="reading-info-prerequisites">
              <li v-for="title in prerequisiteTitles" :key="title">{{ title }}</li>
            </ul>
            <p v-else>None.</p>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>
