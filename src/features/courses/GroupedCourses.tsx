import type { ReactNode } from 'react'
import type { Course, CourseCategory } from '@/types/domain'

function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, 'fr')
}

function CourseCount({ count }: { count: number }) {
  return <span className="ml-1 text-xs font-normal text-slate-400">· {count} cours</span>
}

/**
 * Affiche des cours répartis par catégorisation (tronc commun, domaines et
 * leurs options, autres catégories), afin de visualiser la répartition des
 * cours au sein de l'année (ou d'une période).
 */
export function GroupedCourses({ courses, categories, renderCourse }: {
  courses: Course[]
  categories: CourseCategory[]
  renderCourse: (course: Course) => ReactNode
}) {
  const hasCategories = categories.length > 0
  const troncCommun = courses.filter((c) => c.categoryId === null)
  const coursesFor = (categoryId: string) => courses.filter((c) => c.categoryId === categoryId)
  const domaines = categories.filter((c) => c.kind === 'domaine').sort(byName)
  const autres = categories.filter((c) => c.kind === 'autre').sort(byName)

  return (
    <div className="space-y-4">
      {troncCommun.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            {hasCategories ? 'Tronc commun' : 'Cours'}
            <CourseCount count={troncCommun.length} />
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{troncCommun.map(renderCourse)}</div>
        </div>
      )}

      {domaines.map((domaine) => {
        const options = categories.filter((c) => c.kind === 'option' && c.parentId === domaine.id).sort(byName)
        const direct = coursesFor(domaine.id)
        const optionEntries = options.map((option) => ({ option, items: coursesFor(option.id) }))
        const total = direct.length + optionEntries.reduce((sum, e) => sum + e.items.length, 0)
        if (total === 0) return null
        return (
          <section key={domaine.id} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700">
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Domaine : {domaine.name}
              <CourseCount count={total} />
            </h3>
            {direct.length > 0 && (
              <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{direct.map(renderCourse)}</div>
            )}
            {optionEntries
              .filter((e) => e.items.length > 0)
              .map(({ option, items }) => (
                <div key={option.id} className="mb-3 border-l-2 border-slate-100 pl-3 dark:border-slate-800">
                  <h4 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    Option : {option.name}
                    <CourseCount count={items.length} />
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(renderCourse)}</div>
                </div>
              ))}
          </section>
        )
      })}

      {autres.map((autre) => {
        const items = coursesFor(autre.id)
        if (items.length === 0) return null
        return (
          <section key={autre.id} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700">
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Autre catégorie : {autre.name}
              <CourseCount count={items.length} />
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(renderCourse)}</div>
          </section>
        )
      })}
    </div>
  )
}
