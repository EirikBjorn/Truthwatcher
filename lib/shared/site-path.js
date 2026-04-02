export function normalizeSitePath(value) {
  const rawValue = String(value ?? '').trim()

  if (!rawValue || rawValue === '/') {
    return '/'
  }

  const trimmed = rawValue.replace(/^\/+|\/+$/g, '')

  return trimmed ? `/${trimmed}/` : '/'
}
