import { createClient } from '@supabase/supabase-js'
import { createTableNames } from '../shared/table-names.js'

function getRequiredEnv(name, legacyName) {
  const value = process.env[name] || (legacyName ? process.env[legacyName] : undefined)

  if (!value) {
    const fallbackText = legacyName ? ` or ${legacyName}` : ''
    throw new Error(`Missing ${name}${fallbackText}.`)
  }

  return value
}

export function createSupabaseAdmin() {
  const url = getRequiredEnv('SUPABASE_URL')
  const key = getRequiredEnv('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  })
}

const tables = createTableNames(process.env.SUPABASE_TABLE_PREFIX)

export async function fetchCurrentProgressMap() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from(tables.writingProgress)
    .select('project_slug, project, progress, is_visible')

  if (error) {
    throw error
  }

  return new Map((data ?? []).map((item) => [item.project_slug, item]))
}

export async function upsertProgress(items) {
  const supabase = createSupabaseAdmin()
  const visibleProjectSlugs = items.map((item) => item.project_slug)
  const visibleProjectSlugSet = new Set(visibleProjectSlugs)
  const payload = items.map((item) => ({
    project_slug: item.project_slug,
    project: item.project,
    progress: item.progress,
    is_visible: true,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from(tables.writingProgress)
    .upsert(payload, { onConflict: 'project_slug' })

  if (error) {
    throw error
  }

  const { data: currentVisibleRows, error: currentVisibleError } = await supabase
    .from(tables.writingProgress)
    .select('project_slug')
    .eq('is_visible', true)

  if (currentVisibleError) {
    throw currentVisibleError
  }

  const hiddenProjectSlugs = (currentVisibleRows ?? [])
    .map((row) => row.project_slug)
    .filter((projectSlug) => !visibleProjectSlugSet.has(projectSlug))

  if (hiddenProjectSlugs.length) {
    const { error: hideError } = await supabase
      .from(tables.writingProgress)
      .update({
        is_visible: false,
        updated_at: new Date().toISOString(),
      })
      .in('project_slug', hiddenProjectSlugs)

    if (hideError) {
      throw hideError
    }
  }

  return {
    mode: 'sync',
    count: items.length,
    hiddenCount: hiddenProjectSlugs.length,
  }
}

export async function fetchSubscribersForProjects(projectSlugs) {
  if (!projectSlugs.length) {
    return []
  }

  const supabase = createSupabaseAdmin()
  const { data: projectSubscriptions, error } = await supabase
    .from(tables.projectSubscriptions)
    .select('project_slug, user_id')
    .in('project_slug', projectSlugs)
    .not('user_id', 'is', null)
    .eq('notifications_enabled', true)

  if (error) {
    throw error
  }

  const userIds = [...new Set((projectSubscriptions ?? []).map((row) => row.user_id).filter(Boolean))]

  if (!userIds.length) {
    return []
  }

  const { data: pushSubscriptions, error: pushError } = await supabase
    .from(tables.pushSubscriptions)
    .select('endpoint, subscription, user_id')
    .in('user_id', userIds)

  if (pushError) {
    throw pushError
  }

  const subscriptionsByUserId = (pushSubscriptions ?? []).reduce((groups, row) => {
    if (!groups[row.user_id]) {
      groups[row.user_id] = []
    }

    groups[row.user_id].push(row)
    return groups
  }, {})

  return (projectSubscriptions ?? []).flatMap((row) =>
    (subscriptionsByUserId[row.user_id] ?? []).map((subscriptionRow) => ({
      project_slug: row.project_slug,
      user_id: row.user_id,
      endpoint: subscriptionRow.endpoint,
      subscription: subscriptionRow.subscription,
    })),
  )
}

export async function fetchAllPushSubscriptions() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from(tables.pushSubscriptions)
    .select('endpoint, subscription, user_id')

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchActivityNotificationSubscriptions() {
  const supabase = createSupabaseAdmin()
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from(tables.pushSubscriptions)
    .select('endpoint, subscription, user_id')
    .not('user_id', 'is', null)

  if (subscriptionsError) {
    throw subscriptionsError
  }

  const userIds = [...new Set((subscriptions ?? []).map((row) => row.user_id).filter(Boolean))]

  if (!userIds.length) {
    return []
  }

  const { data: profiles, error: profilesError } = await supabase
    .from(tables.profiles)
    .select('id')
    .in('id', userIds)
    .eq('activity_notifications_enabled', true)

  if (profilesError) {
    throw profilesError
  }

  const enabledUserIds = new Set((profiles ?? []).map((profile) => profile.id))

  return (subscriptions ?? []).filter((row) => enabledUserIds.has(row.user_id))
}

export async function fetchPendingActivityEvents(limit = 100) {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from(tables.activityEvents)
    .select('id, actor_user_id, work_id, activity_type, occurred_at')
    .is('processed_at', null)
    .order('occurred_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function markActivityEventsProcessed(eventIds) {
  if (!eventIds.length) {
    return
  }

  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from(tables.activityEvents)
    .update({
      processed_at: new Date().toISOString(),
    })
    .in('id', eventIds)

  if (error) {
    throw error
  }
}

export async function fetchProfilesByIds(userIds) {
  if (!userIds.length) {
    return []
  }

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from(tables.profiles)
    .select('id, display_name, avatar_url, last_activity_notification_sent_at')
    .in('id', userIds)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function updateProfilesLastActivityNotificationSentAt(actorTimestamps) {
  const updates = Object.entries(actorTimestamps ?? {})

  if (!updates.length) {
    return
  }

  const supabase = createSupabaseAdmin()

  for (const [userId, timestamp] of updates) {
    const { error } = await supabase
      .from(tables.profiles)
      .update({
        last_activity_notification_sent_at: timestamp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      throw error
    }
  }
}

export async function deleteSubscription(endpoint) {
  const supabase = createSupabaseAdmin()
  const { error: pushError } = await supabase
    .from(tables.pushSubscriptions)
    .delete()
    .eq('endpoint', endpoint)

  if (pushError) {
    throw pushError
  }
}
