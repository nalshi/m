export function getSafeAuthRedirect(
  redirect: string | undefined,
  origin = typeof window === 'undefined'
    ? 'http://localhost'
    : window.location.origin
) {
  if (!redirect) return '/'

  try {
    const target = new URL(redirect, origin)
    if (target.origin !== origin) return '/'
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return '/'
  }
}
