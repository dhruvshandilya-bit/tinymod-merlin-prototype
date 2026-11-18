import React from 'react'
import { BookOpen, ChevronRight, Eye, EyeOff, HelpCircle, Megaphone, RotateCcw, Sparkles } from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import { PROJECT_META, ORDER_FORM } from './data/job'
import { QUESTIONS } from './data/questions'
import { WALK } from './data/walkthrough'
import { cn } from './lib/util'
import { Badge } from './components/ui'
import { Estimate } from './components/Estimate'
import { Budget } from './components/Budget'
import { Schedule } from './components/Schedule'
import { Drawers } from './components/refs'
import { NotesPanel, Overview, StepBar } from './components/Walk'

export default function App() {
  return (
    <StoreProvider>
      <Layout />
    </StoreProvider>
  )
}

function Layout() {
  const { toasts, reset, nav, go, showSources, setShowSources, showNotes, setShowNotes, setDrawer } = useStore()
  const step = WALK.find(s => s.key === nav.step)!
  const crumbs: Record<string, string[]> = {
    overview: ['TinyMod job walkthrough'],
    estimate: ['Sales', 'Opportunities', PROJECT_META.customer, `Estimate #${ORDER_FORM.number}`],
    budget: ['Projects', PROJECT_META.customer, 'Budget'],
    draws: ['Projects', PROJECT_META.customer, 'Budget', 'Draws'],
    schedule: ['Projects', PROJECT_META.customer, 'Schedule'],
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-[49px] items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur">
        <span className="flex items-center gap-2 pr-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-400 text-white"><Sparkles size={14} /></span>
          <span className="hidden text-[14px] font-semibold text-ink-950 sm:inline">Merlin <span className="font-normal text-ink-400">× TinyMod</span></span>
        </span>
        <StepBar />
        <div className="ml-auto flex items-center gap-1.5">
          <Toggle on={showSources} onClick={() => setShowSources(!showSources)} icon={showSources ? Eye : EyeOff} label="Show sources" />
          <button onClick={() => setDrawer('sources')} title="Where the data came from" className="grid h-8 w-8 place-items-center rounded-md text-ink-600 hover:bg-ink-100"><BookOpen size={15} /></button>
          <button onClick={() => setDrawer('questions')} className="flex h-8 items-center gap-1 rounded-md bg-danger-50 px-2 text-2xs font-semibold text-danger-600 ring-1 ring-inset ring-danger-500/30 hover:bg-danger-500 hover:text-white">
            <HelpCircle size={13} /> Questions ({QUESTIONS.length})
          </button>
          {!showNotes && <Toggle on={false} onClick={() => setShowNotes(true)} icon={Megaphone} label="Notes" />}
          <button onClick={reset} title="Reset to the sheets as sent" className="grid h-8 w-8 place-items-center rounded-md text-ink-500 hover:bg-ink-100"><RotateCcw size={14} /></button>
        </div>
      </header>

      <div className="flex flex-1">
        <main className="min-w-0 flex-1">
          <div className="border-b border-line bg-white px-6 pb-3 pt-4">
            <div className="flex flex-wrap items-center gap-1.5 text-2xs text-ink-500">
              {crumbs[nav.step].map((c, k, a) => (
                <React.Fragment key={k}>{k > 0 && <ChevronRight size={11} />}<span className={k === a.length - 1 ? 'font-medium text-ink-800' : ''}>{c}</span></React.Fragment>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-[21px] font-semibold leading-tight text-ink-950">{step.title}</h1>
              {nav.step !== 'overview' && (
                <>
                  <Badge>{PROJECT_META.customer}</Badge>
                  <Badge>{PROJECT_META.model}</Badge>
                  <span className="text-2xs text-ink-500">Replaces: <span className="text-ink-700">{step.replaces}</span></span>
                </>
              )}
            </div>
          </div>

          <div className="px-6 py-5">
            {nav.step === 'overview' && <Overview />}
            {nav.step === 'estimate' && <Estimate />}
            {(nav.step === 'budget' || nav.step === 'draws') && <Budget />}
            {nav.step === 'schedule' && <Schedule onOpenDraws={() => go('draws')} />}
          </div>

          <footer className="px-6 pb-8 text-2xs text-ink-400">
            Prototype. Figures are from one of TinyMod's jobs (homeowner renamed). Changes here aren't saved; use reset (↺) to start over.
          </footer>
        </main>
        {showNotes && <NotesPanel />}
      </div>

      <Drawers />
      <div className="pointer-events-none fixed bottom-4 left-4 z-50 flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto rounded-lg bg-ink-950 px-3.5 py-2.5 text-[12.5px] leading-snug text-white shadow-lg">{t.text}</div>
        ))}
      </div>
    </div>
  )
}

const Toggle = ({ on, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick}
    className={cn('flex h-8 items-center gap-1 rounded-md border px-2 text-2xs font-medium',
      on ? 'border-ok-500/40 bg-ok-50 text-ok-700' : 'border-line bg-white text-ink-600 hover:bg-ink-50')}>
    <Icon size={13} /> <span className="hidden xl:inline">{label}</span>
  </button>
)
