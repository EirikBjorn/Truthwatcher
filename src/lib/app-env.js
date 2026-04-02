import { normalizeSitePath } from '../../lib/shared/site-path'

export const sitePath = normalizeSitePath(import.meta.env.BASE_URL)
const inferredStoragePrefix = sitePath === '/' ? '' : sitePath.replace(/\W+/g, '')
const localhostHostnames = new Set(['localhost', '127.0.0.1', '[::1]'])

export function isLocalhost() {
  if (typeof window === 'undefined') {
    return false
  }

  return localhostHostnames.has(window.location.hostname)
}

export function getClientTablePrefix() {
  return import.meta.env.VITE_SUPABASE_TABLE_PREFIX || (isLocalhost() ? 'dev_' : '')
}

export const storagePrefix = import.meta.env.VITE_STORAGE_PREFIX || inferredStoragePrefix
export const storageKeyPrefix = storagePrefix ? `truthwatcher.${storagePrefix}` : 'truthwatcher'
export const dbName = import.meta.env.VITE_DB_NAME || (storagePrefix ? `truthwatcher-${storagePrefix}` : 'truthwatcher')
