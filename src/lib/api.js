import { supabase } from './supabase'

export async function fetchLatestProgress() {
  const { data, error } = await supabase
    .from('writing_progress')
    .select('project_slug, project, progress, updated_at')
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
    .from('project_subscriptions')
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

  const { error } = await supabase.from('push_subscriptions').upsert(
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
      .from('project_subscriptions')
      .delete()
      .eq('project_slug', projectSlug)
      .eq('endpoint', subscription.endpoint)

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabase.from('project_subscriptions').upsert(
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
