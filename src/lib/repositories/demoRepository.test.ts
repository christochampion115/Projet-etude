// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createDemoRepository } from './demoRepository'
import { createId } from '@/lib/id'

// Chaque test utilise un `ownerId` unique : les requêtes du repository
// filtrent par propriétaire, ce qui isole naturellement les données entre
// les tests sans avoir à réinitialiser la base IndexedDB partagée.

describe('createDemoRepository', () => {
  it('seme les catégories de documents par défaut au premier chargement', async () => {
    const repo = createDemoRepository()
    const ownerId = createId()
    const snapshot = await repo.loadAll(ownerId)
    expect(snapshot.documentCategories.length).toBeGreaterThan(0)
    expect(snapshot.documentCategories.map((c) => c.name)).toContain('Notes de cours')
  })

  it('crée un cours puis le retrouve dans un nouvel instantané (persistance)', async () => {
    const repo = createDemoRepository()
    const ownerId = createId()
    await repo.loadAll(ownerId)

    const year = await repo.createAcademicYear({
      id: createId(),
      ownerId,
      label: '2026-2027',
      startDate: null,
      endDate: null,
      isActive: true,
      archivedAt: null,
    })
    const course = await repo.createCourse({
      id: createId(),
      ownerId,
      academicYearId: year.id,
      periodIds: [],
      name: 'Algorithmique',
      categoryId: null,
      professors: [],
      description: null,
      ects: 5,
      status: 'active',
      examModalities: null,
    })

    const snapshot = await repo.loadAll(ownerId)
    expect(snapshot.courses.map((c) => c.id)).toContain(course.id)
    expect(snapshot.courses.find((c) => c.id === course.id)?.name).toBe('Algorithmique')
  })

  it('stocke et restitue le contenu binaire d\'un document téléversé', async () => {
    const repo = createDemoRepository()
    const ownerId = createId()
    await repo.loadAll(ownerId)
    const year = await repo.createAcademicYear({
      id: createId(),
      ownerId,
      label: '2026-2027',
      startDate: null,
      endDate: null,
      isActive: true,
      archivedAt: null,
    })
    const course = await repo.createCourse({
      id: createId(),
      ownerId,
      academicYearId: year.id,
      periodIds: [],
      name: 'Physique',
      categoryId: null,
      professors: [],
      description: null,
      ects: null,
      status: 'active',
      examModalities: null,
    })
    const snapshot = await repo.loadAll(ownerId)
    const categoryId = snapshot.documentCategories[0].id
    const file = new File(['contenu du pdf'], 'notes.pdf', { type: 'application/pdf' })

    const document = await repo.createDocument(
      { id: createId(), ownerId, courseId: course.id, categoryId, displayName: 'Notes', fileName: 'notes.pdf', mimeType: 'application/pdf', size: file.size },
      file,
    )

    const blob = await repo.getDocumentBlob(document.storageRef)
    expect(blob).not.toBeNull()
    expect(blob?.size).toBe(file.size)
    expect(blob?.type).toBe('application/pdf')
    const text = await blob?.text()
    expect(text).toBe('contenu du pdf')
  })

  it('supprime en cascade les données associées à un cours supprimé', async () => {
    const repo = createDemoRepository()
    const ownerId = createId()
    await repo.loadAll(ownerId)
    const year = await repo.createAcademicYear({
      id: createId(),
      ownerId,
      label: '2026-2027',
      startDate: null,
      endDate: null,
      isActive: true,
      archivedAt: null,
    })
    const course = await repo.createCourse({
      id: createId(),
      ownerId,
      academicYearId: year.id,
      periodIds: [],
      name: 'Chimie',
      categoryId: null,
      professors: [],
      description: null,
      ects: null,
      status: 'active',
      examModalities: null,
    })
    const topic = await repo.createTopic({
      id: createId(),
      courseId: course.id,
      title: 'Chapitre 1',
      description: null,
      status: 'pending',
      order: 0,
      completedAt: null,
    })
    const task = await repo.createTask({
      id: createId(),
      ownerId,
      courseId: course.id,
      title: 'Devoir',
      description: null,
      type: 'assignment',
      dueDate: null,
      priority: 'medium',
      status: 'todo',
      completedAt: null,
    })

    await repo.deleteCourse(course.id)

    const snapshot = await repo.loadAll(ownerId)
    expect(snapshot.courses.find((c) => c.id === course.id)).toBeUndefined()
    expect(snapshot.topics.find((t) => t.id === topic.id)).toBeUndefined()
    expect(snapshot.tasks.find((t) => t.id === task.id)).toBeUndefined()
  })
})
