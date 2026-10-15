import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useDataStore } from '@/data/DataProvider'

type FocusPhase = 'work' | 'break'
type FocusStatus = 'idle' | 'running' | 'paused'

export interface FocusTimerState {
  status: FocusStatus
  phase: FocusPhase
  courseId: string | null
  workMinutes: number
  breakMinutes: number
  /** Horodatage (ms) du dernier démarrage/reprise de la phase en cours, `null` si en pause/arrêté. */
  phaseStartedAt: number | null
  /** Temps déjà écoulé (ms) dans la phase courante avant la dernière reprise. */
  elapsedBeforePauseMs: number
}

const STORAGE_KEY = 'etudes-suivi.focus-timer'

function defaultState(): FocusTimerState {
  return {
    status: 'idle',
    phase: 'work',
    courseId: null,
    workMinutes: 25,
    breakMinutes: 5,
    phaseStartedAt: null,
    elapsedBeforePauseMs: 0,
  }
}

function loadPersistedState(): FocusTimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as FocusTimerState
    return { ...defaultState(), ...parsed }
  } catch {
    return defaultState()
  }
}

function persistState(state: FocusTimerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Temps écoulé (ms) dans la phase courante, à un instant `now` donné. */
function elapsedInPhase(state: FocusTimerState, now: number): number {
  if (state.status === 'running' && state.phaseStartedAt !== null) {
    return state.elapsedBeforePauseMs + (now - state.phaseStartedAt)
  }
  return state.elapsedBeforePauseMs
}

function phaseDurationMs(state: FocusTimerState): number {
  return (state.phase === 'work' ? state.workMinutes : state.breakMinutes) * 60_000
}

interface FocusTimerContextValue {
  subscribe: (listener: () => void) => () => void
  getState: () => FocusTimerState
  getRemainingMs: () => number
  start: (options: { courseId: string | null; workMinutes: number; breakMinutes: number }) => void
  pause: () => void
  resume: () => void
  /** Arrête la séance en cours. Si une phase de travail était en cours, le temps réellement écoulé est enregistré. */
  stop: () => void
}

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null)

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const store = useDataStore()
  const stateRef = useRef<FocusTimerState>(loadPersistedState())
  const remainingMsRef = useRef<number>(
    Math.max(0, phaseDurationMs(stateRef.current) - elapsedInPhase(stateRef.current, Date.now())),
  )
  const listenersRef = useRef(new Set<() => void>())

  const emit = useCallback(() => {
    persistState(stateRef.current)
    const remaining = phaseDurationMs(stateRef.current) - elapsedInPhase(stateRef.current, Date.now())
    remainingMsRef.current = Math.max(0, remaining)
    for (const listener of listenersRef.current) listener()
  }, [])

  const logWorkSession = useCallback(
    (durationMs: number) => {
      const minutes = Math.round(durationMs / 60_000)
      if (minutes <= 0) return
      const now = new Date()
      void store.createStudySession({
        courseId: stateRef.current.courseId,
        date: now.toISOString().slice(0, 10),
        startTime: now.toISOString(),
        durationMinutes: minutes,
        source: 'timer',
        notes: null,
      })
    },
    [store],
  )

  const [value] = useState<FocusTimerContextValue>(() => ({
    subscribe(listener) {
      listenersRef.current.add(listener)
      return () => listenersRef.current.delete(listener)
    },
    getState() {
      return stateRef.current
    },
    getRemainingMs() {
      return remainingMsRef.current
    },
    start({ courseId, workMinutes, breakMinutes }) {
      stateRef.current = {
        status: 'running',
        phase: 'work',
        courseId,
        workMinutes,
        breakMinutes,
        phaseStartedAt: Date.now(),
        elapsedBeforePauseMs: 0,
      }
      emit()
    },
    pause() {
      const s = stateRef.current
      if (s.status !== 'running' || s.phaseStartedAt === null) return
      stateRef.current = {
        ...s,
        status: 'paused',
        elapsedBeforePauseMs: s.elapsedBeforePauseMs + (Date.now() - s.phaseStartedAt),
        phaseStartedAt: null,
      }
      emit()
    },
    resume() {
      const s = stateRef.current
      if (s.status !== 'paused') return
      stateRef.current = { ...s, status: 'running', phaseStartedAt: Date.now() }
      emit()
    },
    stop() {
      const s = stateRef.current
      if (s.phase === 'work') {
        logWorkSession(elapsedInPhase(s, Date.now()))
      }
      stateRef.current = defaultState()
      emit()
    },
  }))

  // Boucle de contrôle : vérifie chaque seconde si la phase en cours est terminée.
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current
      if (s.status !== 'running' || s.phaseStartedAt === null) return
      const remaining = phaseDurationMs(s) - elapsedInPhase(s, Date.now())
      if (remaining > 0) {
        emit() // force un re-render des composants affichant le compte à rebours
        return
      }
      if (s.phase === 'work') {
        logWorkSession(phaseDurationMs(s))
        stateRef.current = { ...s, phase: 'break', phaseStartedAt: Date.now(), elapsedBeforePauseMs: 0 }
      } else {
        stateRef.current = {
          ...s,
          phase: 'work',
          status: 'idle',
          phaseStartedAt: null,
          elapsedBeforePauseMs: 0,
        }
      }
      emit()
    }, 1000)
    return () => clearInterval(interval)
  }, [emit, logWorkSession])

  return <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>
}

function useFocusTimerContext(): FocusTimerContextValue {
  const ctx = useContext(FocusTimerContext)
  if (!ctx) throw new Error('useFocusTimer doit être utilisé dans un FocusTimerProvider')
  return ctx
}

export function useFocusTimer() {
  const ctx = useFocusTimerContext()
  const state = useSyncExternalStore(ctx.subscribe, ctx.getState, ctx.getState)
  const remainingMs = useSyncExternalStore(ctx.subscribe, ctx.getRemainingMs, ctx.getRemainingMs)
  return { state, remainingMs, start: ctx.start, pause: ctx.pause, resume: ctx.resume, stop: ctx.stop }
}
