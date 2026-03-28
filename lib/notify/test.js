import { sendTestNotificationToAll } from '../push.js'
import { deleteSubscription, fetchAllPushSubscriptions } from '../supabase/server.js'

export async function sendManualTestNotification() {
  const subscriptions = await fetchAllPushSubscriptions()

  if (!subscriptions.length) {
    console.log('No push subscriptions found')
    return { count: 0 }
  }

  const sent = await sendTestNotificationToAll({
    subscriptions,
    onExpired: deleteSubscription,
  })

  console.log(`Sent ${sent} test notifications`)
  return { count: sent }
}

const isEntryPoint = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href

if (isEntryPoint) {
  sendManualTestNotification().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
