import { supabase } from './supabase'
import { tables } from './tables'
import { getWorkById, getWorkSeriesMeta } from './books'

function getUserDisplayName(user) {
  const metadata = user?.user_metadata ?? {}

  return (
    metadata.full_name ||
    metadata.name ||
    user?.email?.split('@')[0] ||
    'Truthwatcher User'
  )
}

function getUserAvatarUrl(user) {
  const metadata = user?.user_metadata ?? {}

  return metadata.avatar_url || metadata.picture || null
}

function buildProfilePayload(user, overrides = {}) {
  return {
    id: user.id,
    display_name: getUserDisplayName(user),
    avatar_url: getUserAvatarUrl(user),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

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

export async function fetchProjectSubscriptions(userId) {
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from(tables.projectSubscriptions)
    .select('project_slug')
    .eq('user_id', userId)
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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  const { error } = await supabase.from(tables.pushSubscriptions).upsert(
    {
      endpoint: subscription.endpoint,
      user_id: user?.id ?? null,
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

export async function saveProjectSubscription({ projectSlug, enabled }) {
  if (!projectSlug) {
    throw new Error('A project slug is required before saving a project preference.')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('You must be signed in to save project notifications.')
  }

  if (!enabled) {
    const { error } = await supabase
      .from(tables.projectSubscriptions)
      .delete()
      .eq('project_slug', projectSlug)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return
  }

  const { error: deleteError } = await supabase
    .from(tables.projectSubscriptions)
    .delete()
    .eq('project_slug', projectSlug)
    .eq('user_id', user.id)

  if (deleteError) {
    throw deleteError
  }

  const { error } = await supabase.from(tables.projectSubscriptions).insert({
    user_id: user.id,
    project_slug: projectSlug,
    notifications_enabled: true,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    throw error
  }
}

export async function fetchReadingChecklistItems(userId) {
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from(tables.readingChecklistItems)
    .select('work_id')
    .eq('user_id', userId)
    .eq('completed', true)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => row.work_id)
}

export async function fetchReadingChecklistReaders() {
  const { data: checklistRows, error } = await supabase
    .from(tables.readingChecklistItems)
    .select('work_id, user_id')
    .eq('completed', true)

  if (error) {
    throw error
  }

  const userIds = [...new Set((checklistRows ?? []).map((row) => row.user_id))]

  if (!userIds.length) {
    return {}
  }

  const { data: profiles, error: profilesError } = await supabase
    .from(tables.profiles)
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  if (profilesError) {
    throw profilesError
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        id: profile.id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      },
    ]),
  )

  return (checklistRows ?? []).reduce((groups, row) => {
    const profile = profilesById.get(row.user_id)

    if (!profile) {
      return groups
    }

    if (!groups[row.work_id]) {
      groups[row.work_id] = []
    }

    groups[row.work_id].push(profile)
    return groups
  }, {})
}

export async function fetchCurrentlyReadingItems(userId) {
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from(tables.currentlyReadingItems)
    .select('work_id, started_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchCurrentReadingFeed() {
  const { data: currentRows, error } = await supabase
    .from(tables.currentlyReadingItems)
    .select('id, user_id, work_id, started_at')
    .order('started_at', { ascending: false })

  if (error) {
    throw error
  }

  const { data: profiles, error: profilesError } = await supabase
    .from(tables.profiles)
    .select('id, display_name, avatar_url')
    .order('display_name')

  if (profilesError) {
    throw profilesError
  }

  const currentByUserId = new Map()

  for (const row of currentRows ?? []) {
    if (!currentByUserId.has(row.user_id)) {
      currentByUserId.set(row.user_id, row)
    }
  }

  return (profiles ?? [])
    .map((profile) => {
      const row = currentByUserId.get(profile.id)
      const work = row ? getWorkById(row.work_id) : null
      const series = work ? getWorkSeriesMeta(work) : null

      return {
        id: `current-profile:${profile.id}`,
        userId: profile.id,
        firstName: profile.display_name.split(/\s+/)[0] || profile.display_name,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        isCurrentlyReading: Boolean(row && work),
        workId: work?.id ?? null,
        bookTitle: work?.title ?? '',
        publicationOrder: work?.publicationOrder ?? null,
        bookType: work?.type ?? '',
        planet: work?.planet ?? '',
        durationLabel: work?.durationLabel ?? '',
        seriesSlug: series?.slug ?? '',
        seriesLabel: series?.label ?? '',
        seriesShortLabel: series?.shortLabel ?? '',
        startedAt: row?.started_at ?? null,
      }
    })
    .sort((left, right) => {
      if (left.isCurrentlyReading !== right.isCurrentlyReading) {
        return left.isCurrentlyReading ? -1 : 1
      }

      if (left.isCurrentlyReading && right.isCurrentlyReading) {
        return new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()
      }

      return left.displayName.localeCompare(right.displayName)
    })
}

export async function fetchReadingActivity(limit = 20) {
  const { data: eventRows, error } = await supabase
    .from(tables.activityEvents)
    .select('id, actor_user_id, work_id, activity_type, occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const userIds = [...new Set((eventRows ?? []).map((row) => row.actor_user_id))]

  if (!userIds.length) {
    return []
  }

  const { data: profiles, error: profilesError } = await supabase
    .from(tables.profiles)
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  if (profilesError) {
    throw profilesError
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  return (eventRows ?? [])
    .map((row) => {
      const work = getWorkById(row.work_id)
      const profile = profilesById.get(row.actor_user_id)

      if (!work || !profile) {
        return null
      }

      return {
        id: `event:${row.id}`,
        type: row.activity_type,
        userId: row.actor_user_id,
        firstName: profile.display_name.split(/\s+/)[0] || profile.display_name,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        workId: work.id,
        bookTitle: work.title,
        publicationOrder: work.publicationOrder,
        occurredAt: row.occurred_at,
      }
    })
    .filter(Boolean)
}

export async function fetchCurrentProfile(userId) {
  if (!userId) {
    return null
  }

  const { data, error } = await supabase
    .from(tables.profiles)
    .select('id, display_name, avatar_url, activity_notifications_enabled')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    activityNotificationsEnabled: data.activity_notifications_enabled,
  }
}

export async function fetchProfileById(userId) {
  if (!userId) {
    return null
  }

  const { data, error } = await supabase
    .from(tables.profiles)
    .select('id, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
  }
}

export async function syncCurrentProfile(user) {
  if (!user?.id) {
    throw new Error('A signed-in user is required before syncing a profile.')
  }

  const { error } = await supabase.from(tables.profiles).upsert(
    buildProfilePayload(user),
    {
      onConflict: 'id',
    },
  )

  if (error) {
    throw error
  }
}

export async function saveActivityNotificationsPreference({ user, enabled }) {
  if (!user?.id) {
    throw new Error('You must be signed in to change activity notifications.')
  }

  const { error } = await supabase.from(tables.profiles).upsert(
    buildProfilePayload(user, {
      activity_notifications_enabled: enabled,
    }),
    {
      onConflict: 'id',
    },
  )

  if (error) {
    throw error
  }
}

export async function saveReadingChecklistItem({ workId, completed }) {
  if (!workId) {
    throw new Error('A work id is required before saving reading progress.')
  }

  if (!completed) {
    const { error } = await supabase.from(tables.readingChecklistItems).delete().eq('work_id', workId)

    if (error) {
      throw error
    }

    return
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('You must be signed in to save your checklist.')
  }

  const { error } = await supabase.from(tables.readingChecklistItems).upsert(
    {
      user_id: user.id,
      work_id: workId,
      completed: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,work_id',
    },
  )

  if (error) {
    throw error
  }
}

export async function saveCurrentlyReadingItem({ workId, reading }) {
  if (!workId) {
    throw new Error('A work id is required before saving current reading state.')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('You must be signed in to save your current reading state.')
  }

  if (!reading) {
    const { error } = await supabase
      .from(tables.currentlyReadingItems)
      .delete()
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return
  }

  const now = new Date().toISOString()
  const { error: deleteError } = await supabase
    .from(tables.currentlyReadingItems)
    .delete()
    .eq('user_id', user.id)

  if (deleteError) {
    throw deleteError
  }

  const { error } = await supabase.from(tables.currentlyReadingItems).insert({
    user_id: user.id,
    work_id: workId,
    started_at: now,
    updated_at: now,
  })

  if (error) {
    throw error
  }
}
