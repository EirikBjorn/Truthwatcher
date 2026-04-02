import { canSendPushNotifications, sendActivityNotifications } from '../push.js'
import {
  deleteSubscription,
  fetchActivityNotificationSubscriptions,
  fetchPendingActivityEvents,
  fetchProfilesByIds,
  markActivityEventsProcessed,
  updateProfilesLastActivityNotificationSentAt,
} from '../supabase/server.js'

const ACTIVITY_NOTIFICATION_WINDOW_MS = 60 * 60 * 1000

function getNotifiableEvents(events, profilesById) {
  const lastNotifiedAtByActor = new Map(
    [...profilesById.values()].map((profile) => [
      profile.id,
      profile.last_activity_notification_sent_at
        ? new Date(profile.last_activity_notification_sent_at).getTime()
        : null,
    ]),
  )

  return events.filter((event) => {
    const occurredAt = new Date(event.occurred_at).getTime()
    const lastNotifiedAt = lastNotifiedAtByActor.get(event.actor_user_id)

    if (
      lastNotifiedAt &&
      Number.isFinite(lastNotifiedAt) &&
      occurredAt - lastNotifiedAt < ACTIVITY_NOTIFICATION_WINDOW_MS
    ) {
      return false
    }

    lastNotifiedAtByActor.set(event.actor_user_id, occurredAt)
    return true
  })
}

export async function sendPendingActivityNotifications() {
  if (!canSendPushNotifications()) {
    console.warn(
      'Skipping activity notifications because VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT is missing.',
    )
    return { processed: 0, sent: 0, skipped: true }
  }

  const events = await fetchPendingActivityEvents(100)

  if (!events.length) {
    console.log('No pending activity notifications')
    return { processed: 0, sent: 0 }
  }

  const subscriptions = await fetchActivityNotificationSubscriptions()

  if (!subscriptions.length) {
    await markActivityEventsProcessed(events.map((event) => event.id))
    console.log(`Marked ${events.length} activity events as processed with no opted-in recipients`)
    return { processed: events.length, sent: 0 }
  }

  const actorProfiles = await fetchProfilesByIds([
    ...new Set(events.map((event) => event.actor_user_id)),
  ])
  const profilesById = new Map(actorProfiles.map((profile) => [profile.id, profile]))
  const notifiableEvents = getNotifiableEvents(events, profilesById)

  const {
    sentCount,
    notifiedActorTimestamps,
  } = await sendActivityNotifications({
    events: notifiableEvents,
    subscriptions,
    profilesById,
    onExpired: deleteSubscription,
  })

  await updateProfilesLastActivityNotificationSentAt(notifiedActorTimestamps)

  await markActivityEventsProcessed(events.map((event) => event.id))

  console.log(`Processed ${events.length} activity events`)
  console.log(`Sent ${sentCount} activity push notifications`)

  return {
    processed: events.length,
    sent: sentCount,
  }
}

const isEntryPoint = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href

if (isEntryPoint) {
  sendPendingActivityNotifications().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
