<script setup>
import { computed } from 'vue'

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
})

const emit = defineEmits(['toggle', 'toggle-current-reading'])

const visibleReaders = computed(() => props.item.readers?.slice(0, 4) ?? [])
const extraReaderCount = computed(() => Math.max((props.item.readers?.length ?? 0) - 4, 0))
const startedReadingLabel = computed(() => {
  if (!props.item.startedReadingAt) {
    return ''
  }

  const startedDate = new Date(props.item.startedReadingAt)
  const today = new Date()
  const isSameDay =
    startedDate.getFullYear() === today.getFullYear() &&
    startedDate.getMonth() === today.getMonth() &&
    startedDate.getDate() === today.getDate()

  return isSameDay
    ? 'Started today'
    : `Started ${startedDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}`
})

function handleToggle() {
  emit('toggle', props.item.id)
}

function handleCurrentReadingToggle() {
  emit('toggle-current-reading', props.item.id)
}
</script>

<template>
  <div class="checklist-item" :class="[`series-${item.slug}`, { completed: item.completed }]">
    <input
      class="checklist-checkbox"
      type="checkbox"
      :checked="item.completed"
      :disabled="disabled"
      :aria-label="`Mark ${item.title} as read`"
      @change="handleToggle"
    />
    <span class="checklist-copy">
      <span class="checklist-series-chip" :class="`series-${item.slug}`">
        <span class="checklist-series-icon" aria-hidden="true">{{ item.shortLabel }}</span>
        <span>{{ item.label }}</span>
      </span>
      <span class="checklist-title">{{ item.title }}</span>
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
          :class="{ active: item.isCurrentlyReading, disabled: disabled || item.completed }"
        >
          <input
            class="reading-state-checkbox"
            type="checkbox"
            :checked="item.isCurrentlyReading"
            :disabled="disabled || item.completed"
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
      </span>
    </span>
  </div>
</template>
