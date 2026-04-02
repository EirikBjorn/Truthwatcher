import { normalizeSitePath } from '../../lib/shared/site-path'

export const sitePath = normalizeSitePath(import.meta.env.BASE_URL)
const inferredStoragePrefix = sitePath === '/' ? '' : sitePath.replace(/\W+/g, '')

export const storagePrefix = import.meta.env.VITE_STORAGE_PREFIX || inferredStoragePrefix
export const storageKeyPrefix = storagePrefix ? `truthwatcher.${storagePrefix}` : 'truthwatcher'
export const dbName = import.meta.env.VITE_DB_NAME || (storagePrefix ? `truthwatcher-${storagePrefix}` : 'truthwatcher')
