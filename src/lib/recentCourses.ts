const KEY = 'etudes-suivi.recent-courses'
const MAX_ENTRIES = 5

export function getRecentCourseIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function pushRecentCourseId(courseId: string): void {
  const current = getRecentCourseIds().filter((id) => id !== courseId)
  const updated = [courseId, ...current].slice(0, MAX_ENTRIES)
  localStorage.setItem(KEY, JSON.stringify(updated))
}
