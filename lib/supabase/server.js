import { createClient } from '@supabase/supabase-js'

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

export async function fetchCurrentProgressMap() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('writing_progress')
    .select('project_slug, project, progress')

  if (error) {
    throw error
  }

  return new Map((data ?? []).map((item) => [item.project_slug, item]))
}

export async function upsertProgress(items) {
  const supabase = createSupabaseAdmin()
  const payload = items.map((item) => ({
    project_slug: item.project_slug,
    project: item.project,
    progress: item.progress,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('writing_progress')
    .upsert(payload, { onConflict: 'project_slug' })

  if (error) {
    throw error
  }

  return { mode: 'upsert', count: items.length }
}

export async function fetchSubscribersForProjects(projectSlugs) {
  if (!projectSlugs.length) {
    return []
  }

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('project_subscriptions')
    .select('project_slug, endpoint, subscription')
    .in('project_slug', projectSlugs)
    .eq('notifications_enabled', true)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchAllPushSubscriptions() {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, subscription')

  if (error) {
    throw error
  }

  return data ?? []
}

export async function deleteSubscription(endpoint) {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('project_subscriptions')
    .delete()
    .eq('endpoint', endpoint)

  if (error) {
    throw error
  }

  const { error: pushError } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)

  if (pushError) {
    throw pushError
  }
}
