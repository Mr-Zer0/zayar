export function formatDate(timestamp) {
  if (!timestamp) return null
  try {
    return timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return null
  }
}
