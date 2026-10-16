import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useSyncExternalStore } from 'react'
import { AppDataStore } from '@/data/store'
import { createDemoRepository } from '@/lib/repositories/demoRepository'
import { createId } from '@/lib/id'
import { CoursesPage } from './CoursesPage'
import { CourseFormModal } from './CourseFormModal'
import { YearFormModal } from '@/features/settings/YearFormModal'
import { TasksExamsTab } from './detail/TasksExamsTab'
import { TasksPage } from '@/features/tasks/TasksPage'

let store: AppDataStore
vi.mock('@/lib/repositories', async () => {
  const { createDemoRepository } = await import('@/lib/repositories/demoRepository')
  return { getRepository: () => createDemoRepository() }
})
vi.mock('@/data/DataProvider', () => ({
  useDataStore: () => store,
  useSnapshot: () => useSyncExternalStore(store.subscribe, store.getSnapshot),
  useDataStatus: () => ({ status: 'ready', error: null }),
}))

describe('Parcours des cours', () => {
  beforeEach(async () => {
    cleanup()
    store = new AppDataStore()
    await store.load(createId())
  })

  it('crée depuis Mes cours une année avec Q1, Q2 et TA, puis une période supplémentaire', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><CoursesPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Créer une année académique' }))
    await user.type(screen.getByLabelText('Libellé'), '2026-2027')
    await user.click(screen.getByRole('button', { name: 'Ajouter une période' }))
    await user.type(screen.getByLabelText('Période 3'), 'TA')
    await user.click(screen.getByRole('button', { name: 'Créer' }))
    await waitFor(() => expect(store.getSnapshot().academicPeriods).toHaveLength(3))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Ajouter une année' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    await user.click(screen.getByRole('button', { name: 'Ajouter une période' }))
    await user.type(screen.getByLabelText('Nom de la période'), 'Session')
    await user.click(screen.getByRole('button', { name: 'Créer' }))
    await waitFor(() => expect(store.getSnapshot().academicPeriods).toHaveLength(4))
  })

  it("crée aussi les périodes lorsqu'aucun callback de création d'année n'est fourni", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<YearFormModal onClose={onClose} />)
    await user.type(screen.getByLabelText('Libellé'), '2026')
    await user.click(screen.getByRole('button', { name: 'Créer' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(store.getSnapshot().academicPeriods.map((p) => p.name)).toEqual(['Q1', 'Q2'])
  })

  it('refuse les noms de périodes dupliqués avant de créer une année', async () => {
    const user = userEvent.setup()
    render(<YearFormModal onClose={() => {}} />)
    await user.type(screen.getByLabelText('Libellé'), '2026')
    await user.clear(screen.getByLabelText('Période 2'))
    await user.type(screen.getByLabelText('Période 2'), 'q1')
    await user.click(screen.getByRole('button', { name: 'Créer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('distincts')
    expect(store.getSnapshot().academicYears).toHaveLength(0)
  })

  it("crée un domaine et une option depuis Mes cours, puis renomme l'option", async () => {
    const year = await store.createAcademicYear({ label: '2026', startDate: null, endDate: null, periodNames: ['Q1'] })
    const domaine = await store.createCourseCategory({ academicYearId: year.id, kind: 'domaine', name: 'Sciences', parentId: null })
    const user = userEvent.setup()
    render(<MemoryRouter><CoursesPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Ajouter une catégorie' }))
    await user.selectOptions(screen.getByLabelText('Type de catégorie'), 'option')
    await user.selectOptions(await screen.findByLabelText('Domaine parent'), domaine.id)
    await user.type(screen.getByLabelText('Nom'), 'Informatique')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(store.getSnapshot().courseCategories).toHaveLength(2))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const option = store.getSnapshot().courseCategories.find((c) => c.name === 'Informatique')!
    expect(option.kind).toBe('option')
    expect(option.parentId).toBe(domaine.id)
    await user.selectOptions(screen.getByLabelText('Modifier une catégorie'), option.id)
    await user.clear(screen.getByLabelText('Nom'))
    await user.type(screen.getByLabelText('Nom'), 'Informatique A')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(store.getSnapshot().courseCategories.find((c) => c.id === option.id)?.name).toBe('Informatique A'))
  })

  it("affecte un cours à une option d'un domaine et à trois périodes, sans dupliquer les cours du domaine", async () => {
    const year = await store.createAcademicYear({ label: '2026', startDate: null, endDate: null, periodNames: ['Q1', 'Q2', 'TA'] })
    const domaine = await store.createCourseCategory({ academicYearId: year.id, kind: 'domaine', name: 'Sciences', parentId: null })
    const option = await store.createCourseCategory({ academicYearId: year.id, kind: 'option', name: 'Informatique', parentId: domaine.id })
    const user = userEvent.setup()
    const { unmount } = render(<CourseFormModal defaultYearId={year.id} onClose={() => {}} />)
    await user.type(screen.getByLabelText('Nom du cours'), 'Algorithmique')
    await user.selectOptions(screen.getByRole('combobox', { name: /^Catégorisation/ }), option.id)
    for (const name of ['Q1', 'Q2', 'TA']) await user.click(screen.getByRole('checkbox', { name }))
    await user.click(screen.getByRole('button', { name: 'Créer le cours' }))
    await waitFor(() => expect(store.getSnapshot().courses).toHaveLength(1))
    const course = store.getSnapshot().courses[0]
    expect(course.categoryId).toBe(option.id)
    expect(course.periodIds).toHaveLength(3)
    const ownerId = course.ownerId
    expect((await createDemoRepository().loadAll(ownerId)).courses[0]).toMatchObject({ categoryId: option.id, periodIds: course.periodIds })
    unmount()
    render(<MemoryRouter><CoursesPage /></MemoryRouter>)
    expect(screen.getAllByText('Algorithmique', { exact: true })).toHaveLength(3)
  })

  it("efface les périodes et la catégorie quand l'année du cours change", async () => {
    const first = await store.createAcademicYear({ label: '2026', startDate: null, endDate: null, periodNames: ['Q1'] })
    const domaine = await store.createCourseCategory({ academicYearId: first.id, kind: 'domaine', name: 'Commun', parentId: null })
    const course = await store.createCourse({
      academicYearId: first.id, categoryId: domaine.id, periodIds: store.getSnapshot().academicPeriods.map((p) => p.id),
      name: 'Maths', professors: [], description: null, ects: null, examModalities: null,
    })
    const second = await store.createAcademicYear({ label: '2027', startDate: null, endDate: null, periodNames: ['Q2'] })
    const user = userEvent.setup()
    render(<CourseFormModal course={course} onClose={() => {}} />)
    await user.selectOptions(screen.getByLabelText('Année académique'), second.id)
    expect(screen.getByRole('checkbox', { name: 'Q2' })).not.toBeChecked()
    expect(screen.getByRole('combobox', { name: /^Catégorisation/ })).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Choisissez au moins une période')
  })

  it("enregistre les résultats des examens passés dans la fiche du cours et les conserve au rechargement", async () => {
    const year = await store.createAcademicYear({ label: '2026', startDate: null, endDate: null })
    const course = await store.createCourse({ academicYearId: year.id, periodIds: [], name: 'Maths', professors: [], description: null, ects: null, examModalities: null })
    const exam = await store.createExam({ courseId: course.id, title: 'Session passée', date: '2000-01-01', type: 'written', modalities: null })
    await store.createExam({ courseId: course.id, title: 'Session future', date: '2999-01-01', type: 'written', modalities: null })
    const user = userEvent.setup()
    const { unmount } = render(<TasksExamsTab courseId={course.id} tasks={[]} exams={store.getSnapshot().exams} />)
    expect(screen.queryByLabelText('Résultat : Session future')).not.toBeInTheDocument()
    const select = screen.getByLabelText('Résultat : Session passée')
    expect(within(select).getAllByRole('option')).toHaveLength(3)
    await user.selectOptions(select, 'passed')
    await waitFor(() => expect(store.getSnapshot().exams.find((e) => e.id === exam.id)?.result).toBe('passed'))
    expect((await createDemoRepository().loadAll(course.ownerId)).exams.find((e) => e.id === exam.id)?.result).toBe('passed')
    unmount()
    render(<MemoryRouter><TasksPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Examens' }))
    expect(screen.getByLabelText('Résultat : Session passée')).toHaveValue('passed')
    await user.selectOptions(screen.getByLabelText('Résultat : Session passée'), 'failed')
    await waitFor(() => expect(screen.getByLabelText('Résultat : Session passée')).toHaveValue('failed'))
    expect((await createDemoRepository().loadAll(course.ownerId)).exams.find((e) => e.id === exam.id)?.result).toBe('failed')
  })
})
