const baseTableNames = Object.freeze({
  writingProgress: 'writing_progress',
  pushSubscriptions: 'push_subscriptions',
  projectSubscriptions: 'project_subscriptions',
  activityEvents: 'activity_events',
  readingChecklistItems: 'reading_checklist_items',
  currentlyReadingItems: 'currently_reading_items',
  profiles: 'profiles',
})

export function normalizeTablePrefix(value) {
  const prefix = String(value ?? '').trim()

  if (!prefix) {
    return ''
  }

  return prefix.endsWith('_') ? prefix : `${prefix}_`
}

export function createTableNames(prefix) {
  const normalizedPrefix = normalizeTablePrefix(prefix)

  return Object.freeze(
    Object.fromEntries(
      Object.entries(baseTableNames).map(([key, tableName]) => [
        key,
        `${normalizedPrefix}${tableName}`,
      ]),
    ),
  )
}
