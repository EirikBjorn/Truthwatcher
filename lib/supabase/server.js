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
  const { data, error } = await supabase
    .from(tables.projectSubscriptions)
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
    .from(tables.pushSubscriptions)
    .select('endpoint, subscription')

  if (error) {
    throw error
  }

  return data ?? []
}

export async function deleteSubscription(endpoint) {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from(tables.projectSubscriptions)
    .delete()
    .eq('endpoint', endpoint)

  if (error) {
    throw error
  }

  const { error: pushError } = await supabase
    .from(tables.pushSubscriptions)
    .delete()
    .eq('endpoint', endpoint)

  if (pushError) {
    throw pushError
  }
}
