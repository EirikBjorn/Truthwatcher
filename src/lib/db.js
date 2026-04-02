import { COSMERE_WORKS, getWorkSeriesMeta } from './books'
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
  currentReadingByWork = {},
  currentUserId = null,
) {
  const completedSet = new Set(completedWorkIds)

  return COSMERE_WORKS.map((work) => ({
    ...work,
    ...getWorkSeriesMeta(work),
    completed: completedSet.has(work.id),
    isCurrentlyReading: Boolean(currentReadingByWork[work.id]),
    startedReadingAt: currentReadingByWork[work.id] ?? null,
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
  }))
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

  const currentReadingByWork = Object.fromEntries(
    currentReadingItems.map((item) => [item.work_id, item.started_at]),
  )

  return buildReadingList(completedWorkIds, readersByWork, currentReadingByWork, user.id)
}

export async function setReadingItemCompleted({ id, completed, user }) {
  if (!user) {
    throw new Error('You must be signed in to save your checklist.')
  }

  const item = COSMERE_WORKS.find((work) => work.id === id)

  if (!item) {
    throw new Error(`Missing reading list item: ${id}`)
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

export async function setReadingItemCurrentState({ id, reading, user }) {
  if (!user) {
    throw new Error('You must be signed in to save your current reading state.')
  }

  const item = COSMERE_WORKS.find((work) => work.id === id)

  if (!item) {
    throw new Error(`Missing reading list item: ${id}`)
  }

  await syncCurrentProfile(user)
  await saveCurrentlyReadingItem({
    workId: id,
    reading,
  })

  return {
    ...item,
    isCurrentlyReading: reading,
    startedReadingAt: reading ? new Date().toISOString() : null,
  }
}
