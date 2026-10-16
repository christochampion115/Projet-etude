import { useState } from 'react'
import { Select } from '@/components/ui/form'
import { useDataStore } from '@/data/DataProvider'
import { hasExamPassed } from '@/lib/selectors'
import { EXAM_RESULTS, type Exam } from '@/types/domain'

export function ExamResultSelect({ exam }: { exam: Exam }) {
  const store = useDataStore()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  if (!hasExamPassed(exam.date)) return null

  return (
    <div className="mt-2">
      <Select
        aria-label={`Résultat : ${exam.title}`}
        value={exam.result ?? 'pending'}
        disabled={saving}
        onChange={async (e) => {
          const result = EXAM_RESULTS.find((r) => r.value === e.target.value)?.value
          if (!result) {
            setError('Résultat invalide.')
            return
          }
          setSaving(true)
          setError('')
          try {
            await store.updateExam(exam.id, { result })
          } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d'enregistrer le résultat.")
          } finally {
            setSaving(false)
          }
        }}
      >
        {EXAM_RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
