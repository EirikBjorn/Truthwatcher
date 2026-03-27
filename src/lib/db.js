import Dexie from 'dexie'
import { COSMERE_WORKS } from './books'

const db = new Dexie('truthwatcher')

db.version(1).stores({
  reading_list: 'id, order, completed',
})

db.version(2).stores({
  reading_list: 'id, publicationOrder, planet, completed',
})

async function syncReadingList() {
  const existingItems = await db.reading_list.toArray()
  const completedById = new Map(existingItems.map((item) => [item.id, item.completed]))
  const validIds = new Set(COSMERE_WORKS.map((work) => work.id))
  const staleIds = existingItems
    .map((item) => item.id)
    .filter((id) => !validIds.has(id))

  if (staleIds.length) {
    await db.reading_list.bulkDelete(staleIds)
  }

  await db.reading_list.bulkPut(
    COSMERE_WORKS.map((work) => ({
      ...work,
      completed: completedById.get(work.id) ?? false,
    })),
  )
}

export async function getReadingList() {
  await syncReadingList()
  return db.reading_list.toArray()
}

export async function toggleReadingItem(id) {
  const item = await db.reading_list.get(id)

  if (!item) {
    throw new Error(`Missing reading list item: ${id}`)
  }

  const updated = {
    ...item,
    completed: !item.completed,
  }

  await db.reading_list.put(updated)
  return updated
}
