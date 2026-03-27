import { sendProgressNotifications } from '../push.js'
import {
  deleteSubscription,
  fetchCurrentProgressMap,
  fetchSubscribersForProjects,
  upsertProgress,
} from '../supabase/server.js'
import { requestPage } from './http.js'

const url = 'https://www.brandonsanderson.com/'
const percentPattern = /^\d{1,3}%$/

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function isPercent(value) {
  return percentPattern.test(value)
}

function parsePercent(value) {
  return Number.parseInt(value.replace('%', ''), 10)
}

function getLeafTokens($, root) {
  const rootElement = root?.length ? root : $.root()

  return rootElement
    .find('*')
    .filter((_, element) => {
      const tagName = element.tagName?.toLowerCase()

      return (
        !['script', 'style', 'noscript', 'svg'].includes(tagName) &&
        $(element).children().length === 0
      )
    })
    .map((_, element) => normalizeText($(element).text()))
    .get()
    .filter(Boolean)
}

function findProgressContainer($) {
  const heading = $('body *')
    .filter((_, element) => normalizeText($(element).text()).toUpperCase() === "BRANDON'S PROGRESS")
    .first()

  if (!heading.length) {
    throw new Error("Could not find Brandon's progress heading.")
  }

  const containers = [heading, ...heading.parents().toArray().map((element) => $(element))]

  for (const container of containers) {
    const tokens = getLeafTokens($, container)
    const headingIndex = tokens.findIndex((token) => token.toUpperCase() === "BRANDON'S PROGRESS")
    const relevantTokens = headingIndex >= 0 ? tokens.slice(headingIndex + 1, headingIndex + 12) : tokens
    const percentCount = relevantTokens.filter(isPercent).length

    if (percentCount >= 2) {
      return container
    }
  }

  return heading.parent()
}

function extractItemsFromTokens(tokens) {
  const items = []

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const current = tokens[index]
    const next = tokens[index + 1]

    if (isPercent(current) && !isPercent(next)) {
      items.push({
        project: next,
        progress: parsePercent(current),
        project_slug: slugify(next),
      })
      index += 1
      continue
    }

    if (!isPercent(current) && isPercent(next)) {
      items.push({
        project: current,
        progress: parsePercent(next),
        project_slug: slugify(current),
      })
      index += 1
    }
  }

  return Array.from(new Map(items.map((item) => [item.project_slug, item])).values())
}

function diffProgress(previousItems, nextItems) {
  return nextItems
    .map((item) => {
      const previous = previousItems.get(item.project_slug)

      if (!previous || item.progress <= previous.progress) {
        return null
      }

      return {
        ...item,
        previous_progress: previous.progress,
      }
    })
    .filter(Boolean)
}

function hasProgressChanged(previousItems, nextItems) {
  if (previousItems.size !== nextItems.length) {
    return true
  }

  return nextItems.some((item) => {
    const previous = previousItems.get(item.project_slug)
    return !previous || previous.project !== item.project || previous.progress !== item.progress
  })
}

export async function scrapeBrando() {
  const $ = await requestPage(url)
  const container = findProgressContainer($)
  const tokens = getLeafTokens($, container)
  const headingIndex = tokens.findIndex((token) => token.toUpperCase() === "BRANDON'S PROGRESS")
  const relevantTokens = headingIndex >= 0 ? tokens.slice(headingIndex + 1) : tokens
  const items = extractItemsFromTokens(relevantTokens)

  if (!items.length) {
    throw new Error('Progress section was found, but no project percentages were extracted.')
  }

  return items
}

export async function syncBrandoProgress() {
  const oldData = await fetchCurrentProgressMap()
  const newData = await scrapeBrando()
  const hasChanges = hasProgressChanged(oldData, newData)
  const changes = diffProgress(oldData, newData)

  if (!hasChanges) {
    console.log('No scraper changes detected')
    return { mode: 'noop', count: 0, notified: 0 }
  }

  const result = await upsertProgress(newData)
  const subscriptions = await fetchSubscribersForProjects(
    changes.map((item) => item.project_slug),
  )
  const notified = await sendProgressNotifications({
    changes,
    subscriptions,
    onExpired: deleteSubscription,
  })

  console.log(`Saved ${result.count} rows to Supabase (${result.mode})`)
  console.log(`Sent ${notified} push notifications`)

  return {
    ...result,
    notified,
    changedProjects: changes.map((item) => item.project),
  }
}

const isEntryPoint = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href

if (isEntryPoint) {
  syncBrandoProgress().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
