import { createTableNames } from '../../lib/shared/table-names'
import { getClientTablePrefix } from './app-env'

export const tables = createTableNames(getClientTablePrefix())
