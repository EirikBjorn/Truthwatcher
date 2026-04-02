<script setup>
const props = defineProps({
  progressItems: {
    type: Array,
    required: true,
  },
  subscriptionMap: {
    type: Object,
    required: true,
  },
  isSignedIn: {
    type: Boolean,
    required: true,
  },
  notificationPermission: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['toggle-project'])

function handleToggleProject(projectSlug, enabled) {
  emit('toggle-project', { projectSlug, enabled })
}
</script>

<template>
  <section class="panel">
    <div class="section-header">
      <div>
        <p class="eyebrow">Writing Progress</p>
        <h2>Current projects</h2>
      </div>
    </div>

    <p v-if="!isSignedIn" class="status">
      Sign in to save project notification preferences to your profile.
    </p>

    <p v-else-if="notificationPermission !== 'granted'" class="status">
      Enable notifications to get progress updates even when the app is closed.
    </p>

    <div class="progress-grid">
      <article
        v-for="item in progressItems"
        :key="item.project_slug"
        class="progress-card"
        :class="{ completed: item.progress === 100 }"
      >
        <div class="progress-heading">
          <div class="progress-copy">
            <h3>{{ item.project }}</h3>
            <p>{{ item.progress }}% complete</p>
          </div>
          <span v-if="item.progress === 100" class="completion-pill">Complete</span>
        </div>

        <div class="progress-bar" aria-hidden="true">
          <span :style="{ width: `${item.progress}%` }" />
        </div>

        <label class="toggle">
          <input
            type="checkbox"
            :checked="Boolean(subscriptionMap[item.project_slug])"
            :disabled="!isSignedIn"
            @change="handleToggleProject(item.project_slug, $event.target.checked)"
          />
          <span class="toggle-label">Notify me about {{ item.project }}</span>
        </label>
      </article>
    </div>
  </section>
</template>
