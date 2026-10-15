import { useState } from 'react'
import { Pencil, Plus, Trash2, CheckCircle2, Archive } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataBoundary } from '@/components/layout/DataBoundary'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDataStore, useSnapshot } from '@/data/DataProvider'
import { useAuth } from '@/context/AuthContext'
import { isBackendConfigured } from '@/lib/supabase/client'
import { YearFormModal } from './YearFormModal'
import { PeriodFormModal } from './PeriodFormModal'
import { CategoryFormModal } from './CategoryFormModal'
import type { AcademicPeriod, AcademicYear, DocumentCategory } from '@/types/domain'

export function SettingsPage() {
  const { user } = useAuth()
  const store = useDataStore()
  const { academicYears, academicPeriods, documentCategories, documents, preference } = useSnapshot()

  const [yearModal, setYearModal] = useState<{ year?: AcademicYear } | null>(null)
  const [periodModal, setPeriodModal] = useState<{ yearId: string; period?: AcademicPeriod } | null>(null)
  const [categoryModal, setCategoryModal] = useState<{ category?: DocumentCategory } | null>(null)
  const [deleteYear, setDeleteYear] = useState<AcademicYear | null>(null)
  const [deletePeriod, setDeletePeriod] = useState<AcademicPeriod | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<DocumentCategory | null>(null)

  const sortedYears = [...academicYears].sort((a, b) => b.label.localeCompare(a.label, 'fr'))

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Années académiques, périodes, catégories de documents, apparence et minuteur."
      />
      <DataBoundary>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mode de fonctionnement</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {isBackendConfigured ? (
                <p>
                  <Badge tone="success">Backend Supabase actif</Badge> Connecté en tant que{' '}
                  <span className="font-medium">{user?.email}</span>. Vos données sont stockées côté serveur et
                  protégées par les politiques de sécurité Supabase.
                </p>
              ) : (
                <p>
                  <Badge tone="warning">Mode démonstration locale</Badge> Les données sont stockées uniquement dans
                  ce navigateur (IndexedDB), sans compte ni synchronisation réelle. Configurez{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">VITE_SUPABASE_URL</code> et{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">VITE_SUPABASE_ANON_KEY</code>{' '}
                  (voir <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">.env.example</code>) pour
                  activer le backend réel.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apparence et minuteur</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">Thème</span>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={preference?.theme ?? 'system'}
                  onChange={(e) => void store.savePreference({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                >
                  <option value="system">Système</option>
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">Durée de travail (min)</span>
                <input
                  type="number"
                  min={5}
                  max={180}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={preference?.focusWorkMinutes ?? 25}
                  onChange={(e) => void store.savePreference({ focusWorkMinutes: Number(e.target.value) })}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">Durée de pause (min)</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={preference?.focusBreakMinutes ?? 5}
                  onChange={(e) => void store.savePreference({ focusBreakMinutes: Number(e.target.value) })}
                />
              </label>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Années académiques et périodes</CardTitle>
              <Button size="sm" icon={<Plus size={15} />} onClick={() => setYearModal({})}>
                Ajouter une année
              </Button>
            </CardHeader>
            <CardBody className="space-y-4">
              {sortedYears.length === 0 && (
                <EmptyState
                  title="Aucune année académique"
                  description="Créez votre première année académique pour commencer à organiser vos cours."
                  actionLabel="Créer une année"
                  onAction={() => setYearModal({})}
                />
              )}
              {sortedYears.map((year) => {
                const periods = academicPeriods
                  .filter((p) => p.academicYearId === year.id)
                  .sort((a, b) => a.order - b.order)
                return (
                  <div key={year.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{year.label}</span>
                        {year.isActive && <Badge tone="success">Active</Badge>}
                        {year.archivedAt && <Badge tone="neutral">Archivée</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        {!year.isActive && (
                          <Button size="sm" variant="ghost" icon={<CheckCircle2 size={14} />} onClick={() => void store.setActiveAcademicYear(year.id)}>
                            Activer
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => setYearModal({ year })}>
                          Modifier
                        </Button>
                        {!year.archivedAt && (
                          <Button size="sm" variant="ghost" icon={<Archive size={14} />} onClick={() => void store.archiveAcademicYear(year.id)}>
                            Archiver
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setDeleteYear(year)}>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {periods.map((period) => (
                        <button
                          key={period.id}
                          onClick={() => setPeriodModal({ yearId: year.id, period })}
                          className="group flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-accent-300 hover:text-accent-700 dark:border-slate-700 dark:text-slate-300"
                        >
                          {period.name}
                          <Trash2
                            size={12}
                            className="text-slate-300 group-hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletePeriod(period)
                            }}
                          />
                        </button>
                      ))}
                      <button
                        onClick={() => setPeriodModal({ yearId: year.id })}
                        className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-500 hover:border-accent-400 hover:text-accent-600 dark:border-slate-600"
                      >
                        <Plus size={12} /> Période
                      </button>
                    </div>
                  </div>
                )
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catégories de documents</CardTitle>
              <Button size="sm" icon={<Plus size={15} />} onClick={() => setCategoryModal({})}>
                Ajouter une catégorie
              </Button>
            </CardHeader>
            <CardBody className="flex flex-wrap gap-2">
              {documentCategories.map((category) => (
                <span
                  key={category.id}
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  {category.name}
                  <button onClick={() => setCategoryModal({ category })} aria-label="Renommer">
                    <Pencil size={12} className="text-slate-400 hover:text-accent-600" />
                  </button>
                  <button onClick={() => setDeleteCategory(category)} aria-label="Supprimer">
                    <Trash2 size={12} className="text-slate-400 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </CardBody>
          </Card>
        </div>
      </DataBoundary>

      {yearModal && (
        <YearFormModal year={yearModal.year} onClose={() => setYearModal(null)} />
      )}
      {periodModal && (
        <PeriodFormModal yearId={periodModal.yearId} period={periodModal.period} onClose={() => setPeriodModal(null)} />
      )}
      {categoryModal && (
        <CategoryFormModal category={categoryModal.category} onClose={() => setCategoryModal(null)} />
      )}

      <ConfirmDialog
        open={deleteYear !== null}
        title="Supprimer cette année académique ?"
        description={`Les périodes associées seront supprimées. Les cours déjà créés pour "${deleteYear?.label}" seront conservés mais ne seront plus rattachés à une année valide.`}
        onCancel={() => setDeleteYear(null)}
        onConfirm={() => {
          if (deleteYear) void store.deleteAcademicYear(deleteYear.id)
          setDeleteYear(null)
        }}
      />
      <ConfirmDialog
        open={deletePeriod !== null}
        title="Supprimer cette période ?"
        description="Les cours associés à cette période ne seront plus rattachés à elle, mais resteront conservés."
        onCancel={() => setDeletePeriod(null)}
        onConfirm={() => {
          if (deletePeriod) void store.deleteAcademicPeriod(deletePeriod.id)
          setDeletePeriod(null)
        }}
      />
      <ConfirmDialog
        open={deleteCategory !== null}
        title="Supprimer cette catégorie ?"
        description={`${documents.filter((d) => d.categoryId === deleteCategory?.id).length} document(s) utilisent cette catégorie. Elle ne pourra plus être sélectionnée, mais les documents existants seront conservés.`}
        onCancel={() => setDeleteCategory(null)}
        onConfirm={() => {
          if (deleteCategory) void store.deleteDocumentCategory(deleteCategory.id)
          setDeleteCategory(null)
        }}
      />
    </div>
  )
}

