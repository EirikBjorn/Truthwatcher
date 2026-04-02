import { canSendPushNotifications, sendActivityNotifications } from '../push.js'
import {
  deleteSubscription,
  fetchActivityNotificationSubscriptions,
  fetchPendingActivityEvents,
  fetchProfilesByIds,
  markActivityEventsProcessed,
} from '../supabase/server.js'

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

  const sent = await sendActivityNotifications({
    events,
    subscriptions,
    profilesById,
    onExpired: deleteSubscription,
  })

  await markActivityEventsProcessed(events.map((event) => event.id))

  console.log(`Processed ${events.length} activity events`)
  console.log(`Sent ${sent} activity push notifications`)

  return {
    processed: events.length,
    sent,
  }
}

const isEntryPoint = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href

if (isEntryPoint) {
  sendPendingActivityNotifications().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
