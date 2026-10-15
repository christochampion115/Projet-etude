import { useEffect } from 'react'
import { useSnapshot } from '@/data/DataProvider'

/** Applique la préférence de thème (clair / sombre / système) sur l'élément racine. */
export function ThemeSync() {
  const { preference } = useSnapshot()
  const theme = preference?.theme ?? 'system'

  useEffect(() => {
    const root = document.documentElement
    const apply = (isDark: boolean) => root.classList.toggle('dark', isDark)

    if (theme === 'dark') {
      apply(true)
      return
    }
    if (theme === 'light') {
      apply(false)
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    apply(media.matches)
    const listener = (e: MediaQueryListEvent) => apply(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  return null
}
