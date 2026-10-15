// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { FocusTimerProvider, useFocusTimer } from './FocusTimerContext'

const createStudySession = vi.fn().mockResolvedValue(undefined)

vi.mock('@/data/DataProvider', () => ({
  useDataStore: () => ({ createStudySession }),
}))

function TestConsumer() {
  const { state, start, stop, pause, resume } = useFocusTimer()
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="phase">{state.phase}</span>
      <button onClick={() => start({ courseId: 'course-1', workMinutes: 25, breakMinutes: 5 })}>start</button>
      <button onClick={pause}>pause</button>
      <button onClick={resume}>resume</button>
      <button onClick={stop}>stop</button>
    </div>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  createStudySession.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('FocusTimerProvider', () => {
  it("n'enregistre pas une séance interrompue comme une séance complète", async () => {
    render(
      <FocusTimerProvider>
        <TestConsumer />
      </FocusTimerProvider>,
    )

    act(() => {
      screen.getByText('start').click()
    })
    expect(screen.getByTestId('status').textContent).toBe('running')

    // Seulement 10 minutes écoulées sur les 25 prévues.
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000)
    })

    act(() => {
      screen.getByText('stop').click()
    })

    expect(createStudySession).toHaveBeenCalledTimes(1)
    const call = createStudySession.mock.calls[0][0]
    expect(call.durationMinutes).toBe(10)
    expect(call.durationMinutes).toBeLessThan(25)
    expect(screen.getByTestId('status').textContent).toBe('idle')
  })

  it('enregistre la durée complète quand la phase de travail va à son terme', async () => {
    render(
      <FocusTimerProvider>
        <TestConsumer />
      </FocusTimerProvider>,
    )

    act(() => {
      screen.getByText('start').click()
    })

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000 + 1000)
    })

    expect(createStudySession).toHaveBeenCalledTimes(1)
    expect(createStudySession.mock.calls[0][0].durationMinutes).toBe(25)
    expect(screen.getByTestId('phase').textContent).toBe('break')
  })

  it('ne décompte pas le temps passé en pause', async () => {
    render(
      <FocusTimerProvider>
        <TestConsumer />
      </FocusTimerProvider>,
    )

    act(() => {
      screen.getByText('start').click()
    })
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })
    act(() => {
      screen.getByText('pause').click()
    })
    // Le temps qui passe pendant la pause ne doit pas être comptabilisé.
    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000)
    })
    act(() => {
      screen.getByText('resume').click()
    })
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })
    act(() => {
      screen.getByText('stop').click()
    })

    expect(createStudySession).toHaveBeenCalledTimes(1)
    expect(createStudySession.mock.calls[0][0].durationMinutes).toBe(10)
  })
})
