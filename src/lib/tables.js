import { createTableNames } from '../../lib/shared/table-names'

export const tables = createTableNames(import.meta.env.VITE_SUPABASE_TABLE_PREFIX)
