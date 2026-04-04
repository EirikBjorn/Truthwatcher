<script setup>
import { CHECKLIST_TABS } from '../lib/books'
import ReadingChecklistItem from './ReadingChecklistItem.vue'

const props = defineProps({
  completedBooks: {
    type: Number,
    required: true,
  },
  readingListLength: {
    type: Number,
    required: true,
  },
  unreleasedBooks: {
    type: Number,
    required: true,
  },
  isSignedIn: {
    type: Boolean,
    required: true,
  },
  activeChecklistTab: {
    type: String,
    required: true,
  },
  checklistSections: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits([
  'update:active-checklist-tab',
  'toggle-book',
  'toggle-current-reading',
  'toggle-current-listening',
])

function selectChecklistTab(tabId) {
  emit('update:active-checklist-tab', tabId)
}

function handleToggleBook(bookId) {
  emit('toggle-book', bookId)
}

function handleToggleCurrentReading(bookId) {
  emit('toggle-current-reading', bookId)
}

function handleToggleCurrentListening(bookId) {
  emit('toggle-current-listening', bookId)
}
</script>

<template>
  <section class="panel">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reading Checklist</p>
        <h2>
          {{ completedBooks }}/{{ readingListLength }} completed
          <template v-if="unreleasedBooks"> · {{ unreleasedBooks }} unreleased</template>
        </h2>
      </div>
    </div>

    <p v-if="!isSignedIn" class="status">
      Sign in to save your checklist and see progress from other readers.
    </p>

    <div class="tab-row" role="tablist" aria-label="Checklist order">
      <button
        v-for="tab in CHECKLIST_TABS"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeChecklistTab === tab.id }"
        type="button"
        @click="selectChecklistTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="checklist-sections">
      <section v-for="section in checklistSections" :key="section.id" class="checklist-section">
        <h3 class="checklist-heading">{{ section.title }}</h3>

        <div class="checklist">
          <ReadingChecklistItem
            v-for="book in section.items"
            :key="book.id"
            :item="book"
            :meta="book.meta"
            :disabled="!isSignedIn"
            @toggle="handleToggleBook"
            @toggle-current-reading="handleToggleCurrentReading"
            @toggle-current-listening="handleToggleCurrentListening"
          />
        </div>
      </section>
    </div>
  </section>
</template>
