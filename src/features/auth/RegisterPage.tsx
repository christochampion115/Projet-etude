import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Field, TextInput } from '@/components/ui/form'

export function RegisterPage() {
  const { user, isBackendConfigured, signUpWithPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isBackendConfigured || user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setInfo(null)
    const result = await signUpWithPassword(email, password)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else {
      setInfo('Compte créé. Vérifiez votre boîte mail si une confirmation est requise, puis connectez-vous.')
      setTimeout(() => navigate('/login'), 2500)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Créer un compte</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Vos données seront isolées et protégées par compte.</p>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <Field label="Adresse e-mail">
            <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Mot de passe" hint="8 caractères minimum">
            <TextInput
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {info && <p className="text-sm text-emerald-600 dark:text-emerald-400">{info}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? 'Création…' : 'Créer mon compte'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Déjà un compte ? <Link to="/login" className="font-medium text-accent-600">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
