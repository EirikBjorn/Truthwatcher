import webpush from 'web-push'

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

if (vapidConfig) {
  webpush.setVapidDetails(
    vapidConfig.subject,
    vapidConfig.publicKey,
    vapidConfig.privateKey,
  )
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

    const payload = {
      title: `${change.project} moved to ${change.progress}%`,
      body: `${change.project} increased from ${change.previous_progress}% to ${change.progress}%.`,
      url: '/',
      projectSlug: change.project_slug,
      progress: change.progress,
    }

    try {
      await webpush.sendNotification(subscriptionRow.subscription, JSON.stringify(payload))
      sentCount += 1
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await onExpired(subscriptionRow.endpoint)
        continue
      }

      console.error(`Push failed for ${subscriptionRow.project_slug}:`, error.message)
    }
  }

  return sentCount
}
