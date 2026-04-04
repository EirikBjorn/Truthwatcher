import { COSMERE_WORKS, getWorkSeriesMeta, isWorkReleased } from './books'
import {
  fetchCurrentlyReadingItems,
  fetchReadingChecklistItems,
  fetchReadingChecklistReaders,
  saveCurrentlyReadingItem,
  saveReadingChecklistItem,
  syncCurrentProfile,
} from './api'

function createReaderRecord(reader) {
  const initial = (reader.displayName || 'U').trim().charAt(0).toUpperCase() || 'U'

  return {
    ...reader,
    initial,
  }
}

function buildReadingList(
  completedWorkIds = [],
  readersByWork = {},
  currentStateByWork = {},
  currentUserId = null,
) {
  const completedSet = new Set(completedWorkIds)

  return COSMERE_WORKS.map((work) => {
    const currentState = currentStateByWork[work.id] ?? {}
    const isReleased = isWorkReleased(work)

    return {
      ...work,
      ...getWorkSeriesMeta(work),
      isReleased,
      completed: isReleased && completedSet.has(work.id),
      isCurrentlyReading: isReleased && Boolean(currentState.reading),
      startedReadingAt: isReleased ? currentState.reading ?? null : null,
      isCurrentlyListening: isReleased && Boolean(currentState.listening),
      startedListeningAt: isReleased ? currentState.listening ?? null : null,
      readers: [...(readersByWork[work.id] ?? [])]
        .sort((left, right) => {
          if (left.id === currentUserId && right.id !== currentUserId) {
            return -1
          }

          if (right.id === currentUserId && left.id !== currentUserId) {
            return 1
          }

          return left.displayName.localeCompare(right.displayName)
        })
        .map(createReaderRecord),
    }
  })
}

export async function getReadingList(user) {
  if (!user) {
    return buildReadingList()
  }

  const [completedWorkIds, readersByWork, currentReadingItems] = await Promise.all([
    fetchReadingChecklistItems(user.id),
    fetchReadingChecklistReaders(),
    fetchCurrentlyReadingItems(user.id),
  ])

  const currentStateByWork = currentReadingItems.reduce((groups, item) => {
    if (!groups[item.work_id]) {
      groups[item.work_id] = {}
    }

    groups[item.work_id][item.engagement_type] = item.started_at
    return groups
  }, {})

  return buildReadingList(completedWorkIds, readersByWork, currentStateByWork, user.id)
}

export async function setReadingItemCompleted({ id, completed, user }) {
  if (!user) {
    throw new Error('You must be signed in to save your checklist.')
  }

  const item = COSMERE_WORKS.find((work) => work.id === id)

  if (!item) {
    throw new Error(`Missing reading list item: ${id}`)
  }

  if (!isWorkReleased(item)) {
    throw new Error(`${item.title} is not released yet.`)
  }

  await syncCurrentProfile(user)
  await saveReadingChecklistItem({
    workId: id,
    completed,
  })

  return {
    ...item,
    completed,
  }
}

export async function setReadingItemCurrentState({
  id,
  reading,
  user,
  engagementType = 'reading',
}) {
  if (!user) {
    throw new Error('You must be signed in to save your current reading state.')
  }

  const item = COSMERE_WORKS.find((work) => work.id === id)

  if (!item) {
    throw new Error(`Missing reading list item: ${id}`)
  }

  if (!isWorkReleased(item)) {
    throw new Error(`${item.title} is not released yet.`)
  }

  await syncCurrentProfile(user)
  await saveCurrentlyReadingItem({
    workId: id,
    reading,
    engagementType,
  })

  const now = reading ? new Date().toISOString() : null
  const isReadingMode = engagementType === 'reading'

  return {
    ...item,
    isCurrentlyReading: isReadingMode ? reading : false,
    startedReadingAt: isReadingMode ? now : null,
    isCurrentlyListening: !isReadingMode ? reading : false,
    startedListeningAt: !isReadingMode ? now : null,
  }
}
