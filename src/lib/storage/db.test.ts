// @vitest-environment node
import { afterEach, expect, it } from 'vitest'
import { openDB } from 'idb'
import { getDemoDb, resetDemoDbConnection } from './db'

function deleteDemoDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('etudes-suivi-demo')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

afterEach(async () => {
  resetDemoDbConnection()
  await deleteDemoDb()
})

it('migre les cours et examens existants de la version 1 sans perdre leurs données', async () => {
  const old = await openDB('etudes-suivi-demo', 1, {
    upgrade(db) {
      db.createObjectStore('courses', { keyPath: 'id' })
      db.createObjectStore('exams', { keyPath: 'id' })
    },
  })
  await old.put('courses', { id: 'course', name: 'Maths', periodIds: ['Q1', 'Q2'] })
  await old.put('exams', { id: 'exam', title: 'Session', date: '2026-01-01' })
  old.close()
  const db = await getDemoDb()
  expect(db.version).toBe(3)
  expect(await db.get('courses', 'course')).toMatchObject({ name: 'Maths', periodIds: ['Q1', 'Q2'], categoryId: null })
  expect(await db.get('exams', 'exam')).toMatchObject({ title: 'Session', result: null })
  expect(db.objectStoreNames.contains('courseCategories')).toBe(true)
  expect(db.objectStoreNames.contains('courseGroups' as never)).toBe(false)
  db.close()
})

it('migre les groupes génériques de la version 2 en catégories typées (domaine/option) et conserve le rattachement des cours', async () => {
  const old = await openDB<unknown>('etudes-suivi-demo', 2, {
    upgrade(db) {
      db.createObjectStore('courses', { keyPath: 'id' })
      db.createObjectStore('exams', { keyPath: 'id' })
      db.createObjectStore('courseGroups', { keyPath: 'id' })
    },
  })
  await old.put('courseGroups', { id: 'domain-1', academicYearId: 'year-1', parentId: null, name: 'Informatique', ownerId: 'owner-1' })
  await old.put('courseGroups', { id: 'option-1', academicYearId: 'year-1', parentId: 'domain-1', name: 'Sécurité', ownerId: 'owner-1' })
  await old.put('courses', { id: 'course', name: 'Réseaux', periodIds: [], groupId: 'option-1' })
  old.close()
  const db = await getDemoDb()
  expect(db.version).toBe(3)
  expect(db.objectStoreNames.contains('courseGroups' as never)).toBe(false)
  const domain = await db.get('courseCategories', 'domain-1')
  const option = await db.get('courseCategories', 'option-1')
  expect(domain).toMatchObject({ kind: 'domaine', name: 'Informatique' })
  expect(option).toMatchObject({ kind: 'option', name: 'Sécurité', parentId: 'domain-1' })
  expect(await db.get('courses', 'course')).toMatchObject({ name: 'Réseaux', categoryId: 'option-1' })
  db.close()
})
