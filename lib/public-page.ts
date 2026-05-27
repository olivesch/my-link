export function getPublicPagePath(displayName: string) {
  return `/${encodeURIComponent(displayName)}`
}
