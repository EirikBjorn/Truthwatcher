import { sendProgressNotifications } from '../push.js'
import { deleteSubscription, fetchAllPushSubscriptions } from '../supabase/server.js'

const SPOOF_PROJECT = {
  project: 'Dragonsteel Prime',
  project_slug: 'dragonsteel-prime',
}

function getSpoofChange(variant) {
  if (variant === 'complete') {
    return {
      ...SPOOF_PROJECT,
      previous_progress: 69,
      progress: 100,
    }
  }

  return {
    ...SPOOF_PROJECT,
    previous_progress: 42,
    progress: 69,
  }
}

function getVariant() {
  const rawVariant = process.env.SPOOF_PROGRESS_VARIANT || process.argv[2] || 'normal'
  const normalizedVariant = String(rawVariant).trim().toLowerCase()

  if (!['normal', 'complete'].includes(normalizedVariant)) {
    throw new Error(`Unsupported SPOOF_PROGRESS_VARIANT: ${rawVariant}`)
  }

  return normalizedVariant
}

export async function sendSpoofProgressNotification(variant = getVariant()) {
  const subscriptions = await fetchAllPushSubscriptions()

  if (!subscriptions.length) {
    console.log('No push subscriptions found')
    return { count: 0, variant }
  }

  const change = getSpoofChange(variant)
  const targetedSubscriptions = subscriptions.map((subscriptionRow) => ({
    ...subscriptionRow,
    project_slug: SPOOF_PROJECT.project_slug,
  }))

  const sent = await sendProgressNotifications({
    changes: [change],
    subscriptions: targetedSubscriptions,
    onExpired: deleteSubscription,
  })

  console.log(
    `Sent ${sent} spoof ${variant === 'complete' ? 'completion' : 'progress'} notifications for ${SPOOF_PROJECT.project}`,
  )

  return {
    count: sent,
    variant,
  }
}

const isEntryPoint = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href

if (isEntryPoint) {
  sendSpoofProgressNotification().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
