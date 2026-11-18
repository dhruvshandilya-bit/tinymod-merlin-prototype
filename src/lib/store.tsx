import React, { createContext, useContext, useState } from 'react'
import { newId, padTo, type Draw, type Line, type Project } from './budget'
import type { Blue } from './blue'
import { jobBlue, jobProject, jobSteps, type Step, type StepStatus } from '../data/job'

export interface Toast { id: number; text: string }
export type BudgetTab = 'budget' | 'changeOrders' | 'draws' | 'conversation'
export interface Nav { screen: 'estimate' | 'budget' | 'schedule' | 'coversheet'; budgetTab: BudgetTab }
type Screen = 'estimate' | 'budget' | 'draws' | 'schedule'

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

function useStoreValue() {
  const [project, setProject] = useState<Project>(() => clone(jobProject))
  const [blue, setBlue] = useState<Blue>(() => clone(jobBlue))
  const [steps, setSteps] = useState<Step[]>(() => clone(jobSteps))
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showSources, setShowSources] = useState(true)
  const [drawer, setDrawer] = useState<null | 'questions' | 'sources'>(null)
  const [focusQ, setFocusQ] = useState<string | null>(null)
  const [nav, setNav] = useState<Nav>({ screen: 'estimate', budgetTab: 'budget' })
  const openQuestion = (id: string) => { setFocusQ(id); setDrawer('questions') }
  const go = (screen: Screen) => {
    setNav(screen === 'draws' ? { screen: 'budget', budgetTab: 'draws' } : screen === 'budget' ? { screen: 'budget', budgetTab: 'budget' } : { ...nav, screen })
    window.scrollTo({ top: 0 })
  }

  const toast = (text: string) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, text }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5200)
  }

  const updateLine = (id: string, patch: Partial<Line>) =>
    setProject(p => ({ ...p, lines: p.lines.map(l => (l.id === id ? { ...l, ...patch } : l)) }))

  const setDraws = (draws: Draw[]) =>
    setProject(p => {
      const n = draws.length
      const clampIdx = (i: number) => Math.max(0, Math.min(n - 1, i))
      return {
        ...p,
        draws,
        track: padTo(p.track, n),
        house: { ...p.house, depositDraw: clampIdx(p.house.depositDraw), balanceDraw: clampIdx(p.house.balanceDraw) },
        lines: p.lines.map(l =>
          l.alloc.mode === 'pin' ? { ...l, alloc: { mode: 'pin', draw: clampIdx(l.alloc.draw) } }
          : l.alloc.mode === 'split' ? { ...l, alloc: { mode: 'split', pct: padTo(l.alloc.pct, n) } }
          : l),
      }
    })

  /** Pay a line's overrun out of contingency, the way the sheet's "Contingency Items" rows were meant to. */
  const fundFromContingency = (lineId: string, amount: number) =>
    setProject(p => {
      const src = p.lines.find(l => l.id === lineId)!
      const nextOpen = Math.max(0, p.draws.findIndex(d => d.status !== 'funded'))
      const item: Line = {
        id: newId('item'), code: src.code, name: `Contingency item: ${src.name} overrun`, kind: 'item',
        amount, approved: amount, stage: src.stage, paid: 0, gcBase: false, coversId: src.id,
        alloc: { mode: 'pin', draw: nextOpen }, note: `Bid came in above the approved ${src.approved.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
      }
      const idx = p.lines.findIndex(l => l.kind === 'contingency')
      const lines = [...p.lines]
      lines.splice(idx + 1, 0, item)
      return { ...p, lines }
    })

  const setStepStatus = (id: string, status: StepStatus) =>
    setSteps(s => s.map(x => (x.id === id ? { ...x, status } : x)))

  const reset = () => {
    setProject(clone(jobProject)); setBlue(clone(jobBlue)); setSteps(clone(jobSteps))
    toast('Reset to the sheets as sent.')
  }

  return { project, setProject, blue, setBlue, steps, setSteps, toasts, toast,
           updateLine, setDraws, fundFromContingency, setStepStatus, reset,
           showSources, setShowSources, drawer, setDrawer, focusQ, openQuestion, nav, setNav, go }
}

type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)
export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const v = useStoreValue()
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
export const useStore = () => useContext(Ctx)!
