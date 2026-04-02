import { supabase } from './supabase'
import { tables } from './tables'

export async function fetchLatestProgress() {
  const { data, error } = await supabase
    .from(tables.writingProgress)
    .select('project_slug, project, progress, updated_at')
    .eq('is_visible', true)
    .order('project_slug')

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchProjectSubscriptions(endpoint) {
  if (!endpoint) {
    return []
  }

  const { data, error } = await supabase
    .from(tables.projectSubscriptions)
    .select('project_slug')
    .eq('endpoint', endpoint)
    .eq('notifications_enabled', true)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => row.project_slug)
}

export async function savePushSubscription(subscription) {
  if (!subscription?.endpoint) {
    throw new Error('A web push subscription is required before it can be saved.')
  }

  const { error } = await supabase.from(tables.pushSubscriptions).upsert(
    {
      endpoint: subscription.endpoint,
      subscription,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'endpoint',
    },
  )

  if (error) {
    throw error
  }

  return subscription
}

export async function saveProjectSubscription({ projectSlug, enabled, subscription }) {
  if (!subscription?.endpoint) {
    throw new Error('A web push subscription is required before saving a project preference.')
  }

  if (!enabled) {
    const { error } = await supabase
      .from(tables.projectSubscriptions)
      .delete()
      .eq('project_slug', projectSlug)
      .eq('endpoint', subscription.endpoint)

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabase.from(tables.projectSubscriptions).upsert(
    {
      project_slug: projectSlug,
      endpoint: subscription.endpoint,
      notifications_enabled: true,
      subscription,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'project_slug,endpoint',
    },
  )

  if (error) {
    throw error
  }
}
