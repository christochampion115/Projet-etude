import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus, Search, Archive } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useSnapshot } from '@/data/DataProvider'
import { activeAcademicYear, archivedOrCompletedCourses, courseCategoryOptions, periodsForYear, visibleCourses } from '@/lib/selectors'
import { CourseCard } from './CourseCard'
import { CourseFormModal } from './CourseFormModal'
import { YearFormModal } from '@/features/settings/YearFormModal'
import { PeriodFormModal } from '@/features/settings/PeriodFormModal'
import { CourseCategoryFormModal } from './CourseCategoryFormModal'
import { GroupedCourses } from './GroupedCourses'
import type { Course, CourseCategory } from '@/types/domain'

export function CoursesPage() {
  const navigate = useNavigate()
  const { academicYears, academicPeriods, courses, courseCategories, topics, tasks, exams } = useSnapshot()
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [showArchived, setShowArchived] = useState(false)
  const [courseModal, setCourseModal] = useState<{ open: boolean; periodId?: string } | null>(null)
  const [yearModalOpen, setYearModalOpen] = useState(false)
  const [periodModalOpen, setPeriodModalOpen] = useState(false)
  const [categoryModal, setCategoryModal] = useState<{ category?: CourseCategory } | null>(null)

  const year = academicYears.find((y) => y.id === selectedYearId) ?? activeAcademicYear(academicYears)
  const periods = year ? periodsForYear(academicPeriods, year.id) : []
  const categories = courseCategories.filter((c) => c.academicYearId === year?.id)

  const active = visibleCourses(courses.filter((c) => c.academicYearId === year?.id))
  const archived = archivedOrCompletedCourses(courses.filter((c) => c.academicYearId === year?.id))
  const renderCourse = (course: Course) => (
    <CourseCard key={course.id} course={course}
      topics={topics.filter((t) => t.courseId === course.id)}
      tasks={tasks.filter((t) => t.courseId === course.id)}
      exams={exams.filter((e) => e.courseId === course.id)}
      onOpen={() => navigate(`/courses/${course.id}`)}
    />
  )

  const term = search.trim().toLowerCase()
  const filtered = active.filter(
    (c) => c.name.toLowerCase().includes(term) || c.professors.some((p) => p.toLowerCase().includes(term)),
  )

  if (academicYears.length === 0) {
    return (
      <div>
        <PageHeader title="Mes cours" description="Organisez vos cours par année académique et par période." />
        <DataBoundary>
          <EmptyState
            title="Aucune année académique configurée"
            description="Créez d'abord une année académique (ex. 2026-2027) avant d'ajouter vos cours."
            actionLabel="Créer une année académique"
            onAction={() => setYearModalOpen(true)}
          />
        </DataBoundary>
        {yearModalOpen && <YearFormModal onCreated={(y) => setSelectedYearId(y.id)} onClose={() => setYearModalOpen(false)} />}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Mes cours"
        description="Organisez vos cours par année académique et par période."
        actions={
          <>
            <Button onClick={() => setYearModalOpen(true)}>Ajouter une année</Button>
            <Button onClick={() => setPeriodModalOpen(true)}>Ajouter une période</Button>
            <Button onClick={() => setCategoryModal({})}>Ajouter une catégorie</Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCourseModal({ open: true })}>
              Ajouter un cours
            </Button>
          </>
        }
      />
      <DataBoundary>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={year?.id ?? ''}
            onChange={(e) => setSelectedYearId(e.target.value)}
          >
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </select>
          {categories.length > 0 && year && (
            <select
              aria-label="Modifier une catégorie"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value=""
              onChange={(e) => {
                const category = categories.find((c) => c.id === e.target.value)
                if (category) setCategoryModal({ category })
              }}
            >
              <option value="">Modifier une catégorie…</option>
              {courseCategoryOptions(categories, year.id).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          )}
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un cours ou un professeur…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>

        {search.trim() ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                topics={topics.filter((t) => t.courseId === course.id)}
                tasks={tasks.filter((t) => t.courseId === course.id)}
                exams={exams.filter((e) => e.courseId === course.id)}
                onOpen={() => navigate(`/courses/${course.id}`)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-slate-400">Aucun cours ne correspond à votre recherche.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {periods.length === 0 && (
              <EmptyState
                title="Aucune période pour cette année"
                description="Ajoutez des périodes (Q1, Q2, TA…) pour organiser vos cours."
                actionLabel="Ajouter une période"
                onAction={() => setPeriodModalOpen(true)}
              />
            )}
            {periods.map((period) => {
              const periodCourses = active.filter((c) => c.periodIds.includes(period.id))
              const isCollapsed = collapsed[period.id]
              return (
                <div key={period.id} className="rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex w-full items-center justify-between gap-2 px-4 py-3">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => setCollapsed((c) => ({ ...c, [period.id]: !c[period.id] }))}
                    >
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      <span className="font-medium text-slate-900 dark:text-slate-100">{period.name}</span>
                      {(period.startDate || period.endDate) && (
                        <span className="text-xs text-slate-400">
                          {period.startDate ?? '…'} – {period.endDate ?? '…'}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">· {periodCourses.length} cours</span>
                    </button>
                    <Button
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => setCourseModal({ open: true, periodId: period.id })}
                    >
                      Ajouter un cours
                    </Button>
                  </div>
                  {!isCollapsed && (
                    <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                      {periodCourses.length === 0 ? (
                        <p className="text-sm text-slate-400">Aucun cours dans cette période pour le moment.</p>
                      ) : (
                        <GroupedCourses courses={periodCourses} categories={categories} renderCourse={renderCourse} />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {active.some((c) => !periods.some((p) => c.periodIds.includes(p.id))) && (
              <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h2 className="mb-3 font-medium">Sans période</h2>
                <GroupedCourses courses={active.filter((c) => !periods.some((p) => c.periodIds.includes(p.id)))} categories={categories} renderCourse={renderCourse} />
              </section>
            )}
          </div>
        )}

        {archived.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
            >
              <Archive size={15} />
              Cours terminés / archivés ({archived.length})
              {showArchived ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
            {showArchived && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {archived.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    topics={topics.filter((t) => t.courseId === course.id)}
                    tasks={tasks.filter((t) => t.courseId === course.id)}
                    exams={exams.filter((e) => e.courseId === course.id)}
                    onOpen={() => navigate(`/courses/${course.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </DataBoundary>

      {yearModalOpen && <YearFormModal onCreated={(y) => setSelectedYearId(y.id)} onClose={() => setYearModalOpen(false)} />}
      {periodModalOpen && year && <PeriodFormModal yearId={year.id} onClose={() => setPeriodModalOpen(false)} />}
      {categoryModal && year && (
        <CourseCategoryFormModal yearId={year.id} category={categoryModal.category} onClose={() => setCategoryModal(null)} />
      )}
      {courseModal?.open && (
        <CourseFormModal
          defaultYearId={year?.id}
          defaultPeriodId={courseModal.periodId}
          onClose={() => setCourseModal(null)}
        />
      )}
    </div>
  )
}
