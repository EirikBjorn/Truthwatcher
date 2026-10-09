<script setup>
import { computed } from 'vue'
import { COSMERE_WORKS } from '../lib/books'

const props = defineProps({
  completedWorkIds: {
    type: Array,
    default: () => [],
  },
  canToggle: {
    type: Boolean,
    default: false,
  },
  busy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-book'])

const books = computed(() => {
  const completedIds = new Set(props.completedWorkIds)

  return [...COSMERE_WORKS]
    .sort((left, right) => left.publicationOrder - right.publicationOrder)
    .map((work) => ({ ...work, completed: completedIds.has(work.id) }))
})

function handleToggle(bookId) {
  if (props.canToggle && !props.busy) {
    emit('toggle-book', bookId)
  }
}
</script>

<template>
  <section class="publication-progress-card" aria-label="Books in publication order">
    <ol class="publication-progress-list" role="list">
      <li v-for="book in books" :key="book.id">
        <component
          :is="canToggle ? 'button' : 'div'"
          class="publication-progress-row"
          :class="{
            'publication-progress-row-complete': book.completed,
            'publication-progress-row-interactive': canToggle,
          }"
          :type="canToggle ? 'button' : undefined"
          :disabled="canToggle && busy"
          :aria-label="canToggle ? `Mark ${book.title} as ${book.completed ? 'unread' : 'read'}` : undefined"
          @click="handleToggle(book.id)"
        >
          <span class="publication-progress-number" aria-hidden="true">
            {{ String(book.publicationOrder).padStart(2, '0') }}
          </span>
          <span class="publication-progress-title" :title="book.title">{{ book.title }}</span>
          <span class="publication-progress-status" aria-hidden="true">{{ book.completed ? '✓' : '–' }}</span>
          <span v-if="!canToggle" class="sr-only">{{ book.completed ? 'Read' : 'Not read' }}</span>
        </component>
      </li>
    </ol>
  </section>
</template>
