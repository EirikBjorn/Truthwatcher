import webpush from 'web-push'
import { getWorkById } from '../src/lib/books.js'
import { normalizeSitePath } from './shared/site-path.js'

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT

  if (!publicKey || !privateKey || !subject) {
    return null
  }

  return {
    publicKey,
    privateKey,
    subject,
  }
}

const vapidConfig = getVapidConfig()
const notificationTargetPath = normalizeSitePath(process.env.APP_BASE_PATH)

if (vapidConfig) {
  webpush.setVapidDetails(
    vapidConfig.subject,
    vapidConfig.publicKey,
    vapidConfig.privateKey,
  )
}

export function canSendPushNotifications() {
  return Boolean(vapidConfig)
}

async function sendNotificationToSubscription({ subscriptionRow, payload, onExpired, label }) {
  try {
    await webpush.sendNotification(subscriptionRow.subscription, JSON.stringify(payload))
    return true
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await onExpired(subscriptionRow.endpoint)
      return false
    }

    console.error(`Push failed for ${label}:`, error.message)
    return false
  }
}

export async function sendProgressNotifications({ changes, subscriptions, onExpired }) {
  if (!subscriptions.length) {
    return 0
  }

  if (!vapidConfig) {
    console.warn('Skipping push notifications because VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT is missing.')
    return 0
  }

  let sentCount = 0

  for (const subscriptionRow of subscriptions) {
    const change = changes.find((item) => item.project_slug === subscriptionRow.project_slug)

    if (!change) {
      continue
    }

    const reachedComplete = change.progress === 100 && change.previous_progress < 100
    const payload = {
      title: reachedComplete
        ? `${change.project} hit 100%! 🎉`
        : `${change.project} moved to ${change.progress}%!`,
      body: reachedComplete
        ? `Brando has completed ${change.project}!`
        : `${change.project} increased from ${change.previous_progress}% to ${change.progress}%!`,
      url: notificationTargetPath,
      projectSlug: change.project_slug,
      progress: change.progress,
      isComplete: reachedComplete,
    }

    const sent = await sendNotificationToSubscription({
      subscriptionRow,
      payload,
      onExpired,
      label: subscriptionRow.project_slug,
    })

    if (sent) {
      sentCount += 1
    }
  }

  return sentCount
}

export async function sendTestNotificationToAll({ subscriptions, onExpired }) {
  if (!subscriptions.length) {
    return 0
  }

  if (!vapidConfig) {
    console.warn(
      'Skipping push notifications because VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT is missing.',
    )
    return 0
  }

  let sentCount = 0

  for (const subscriptionRow of subscriptions) {
    const sent = await sendNotificationToSubscription({
      subscriptionRow,
      payload: {
        title: 'Truthwatcher Test!',
        body: 'I am a stick',
        url: notificationTargetPath,
      },
      onExpired,
      label: subscriptionRow.endpoint,
    })

    if (sent) {
      sentCount += 1
    }
  }

  return sentCount
}

export async function sendActivityNotifications({ events, subscriptions, profilesById, onExpired }) {
  if (!events.length || !subscriptions.length) {
    return {
      sentCount: 0,
      notifiedEventIds: [],
      notifiedActorTimestamps: {},
    }
  }

  if (!vapidConfig) {
    console.warn(
      'Skipping push notifications because VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT is missing.',
    )
    return {
      sentCount: 0,
      notifiedEventIds: [],
      notifiedActorTimestamps: {},
    }
  }

  let sentCount = 0
  const notifiedEventIds = []
  const notifiedActorTimestamps = {}

  for (const event of events) {
    const actorProfile = profilesById.get(event.actor_user_id)
    const work = getWorkById(event.work_id)

    if (!actorProfile || !work) {
      continue
    }

    const firstName = actorProfile.display_name.split(/\s+/)[0] || actorProfile.display_name
    const payload = {
      title:
        event.activity_type === 'finished'
          ? `${firstName} just finished ${work.title}`
          : event.activity_type === 'listening'
            ? `${firstName} started listening to ${work.title}`
            : `${firstName} started ${work.title}`,
      body: `Publication #${work.publicationOrder}`,
      url: notificationTargetPath,
      type: event.activity_type,
      workId: work.id,
      actorUserId: event.actor_user_id,
      occurredAt: event.occurred_at,
      tag: `activity:${event.id}`,
    }
    let eventSent = false

    for (const subscriptionRow of subscriptions) {
      if (!subscriptionRow.user_id || subscriptionRow.user_id === event.actor_user_id) {
        continue
      }

      const sent = await sendNotificationToSubscription({
        subscriptionRow,
        payload,
        onExpired,
        label: `activity:${event.id}:${subscriptionRow.endpoint}`,
      })

      if (sent) {
        sentCount += 1
        eventSent = true
      }
    }

    if (eventSent) {
      notifiedEventIds.push(event.id)
      notifiedActorTimestamps[event.actor_user_id] = event.occurred_at
    }
  }

  return {
    sentCount,
    notifiedEventIds,
    notifiedActorTimestamps,
  }
}
