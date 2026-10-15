import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-5xl font-semibold text-slate-300 dark:text-slate-700">404</p>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Page introuvable</h2>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Button variant="primary" className="mt-2" onClick={() => navigate('/dashboard')}>
        Retour au tableau de bord
      </Button>
    </div>
  )
}
