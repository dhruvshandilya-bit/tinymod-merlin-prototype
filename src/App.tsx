import React from 'react'
import { BarChart3, BookOpen, Boxes, ChevronRight, FolderKanban, HelpCircle, RotateCcw, ShoppingBag, Sparkles, Users, Wallet, Eye, EyeOff } from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import { PROJECT_META, ORDER_FORM } from './data/job'
import { QUESTIONS } from './data/questions'
import { cn } from './lib/util'
import { Badge } from './components/ui'
import { Estimate } from './components/Estimate'
import { Budget } from './components/Budget'
import { Schedule } from './components/Schedule'
import { BlueSheetPanel } from './components/BlueSheet'
import { Drawers } from './components/refs'

export default function App() {
  return (
    <StoreProvider>
      <Layout />
    </StoreProvider>
  )
}

function Layout() {
  const { toasts, reset, nav, setNav, showSources, setShowSources, setDrawer } = useStore()
  const inProject = nav.screen !== 'estimate'
  const estimateTotal = ORDER_FORM.basePrice + ORDER_FORM.options.reduce((a, o) => a + o.price, 0)
  const projectTabs: { key: typeof nav.screen; label: string }[] = [
    { key: 'budget', label: 'Budget' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'coversheet', label: 'Cover Sheet' },
  ]

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar inProject={inProject} onSales={() => setNav({ ...nav, screen: 'estimate' })} onProjects={() => setNav({ ...nav, screen: 'budget' })} />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-line bg-white/95 px-6 py-2 backdrop-blur">
          <span className="text-2xs font-medium text-ink-500">Prototype notes</span>
          <button onClick={() => setShowSources(!showSources)}
            className={cn('flex h-7 items-center gap-1 rounded-md border px-2 text-2xs font-medium',
              showSources ? 'border-ok-500/40 bg-ok-50 text-ok-700' : 'border-line bg-white text-ink-600 hover:bg-ink-50')}>
            {showSources ? <Eye size={12} /> : <EyeOff size={12} />} Source chips {showSources ? 'on' : 'off'}
          </button>
          <button onClick={() => setDrawer('sources')} className="flex h-7 items-center gap-1 rounded-md border border-line bg-white px-2 text-2xs font-medium text-ink-700 hover:bg-ink-50">
            <BookOpen size={12} /> Where the data came from
          </button>
          <button onClick={() => setDrawer('questions')} className="flex h-7 items-center gap-1 rounded-md border border-danger-500/30 bg-danger-50 px-2 text-2xs font-semibold text-danger-600 hover:bg-danger-500 hover:text-white">
            <HelpCircle size={12} /> Open questions ({QUESTIONS.length})
          </button>
          <button onClick={reset} className="ml-auto flex h-7 items-center gap-1 rounded-md border border-line bg-white px-2 text-2xs text-ink-600 hover:bg-ink-50">
            <RotateCcw size={11} /> Reset
          </button>
        </div>

        <div className="border-b border-line bg-white">
          <div className="flex flex-wrap items-center gap-2 px-6 pt-4 text-2xs text-ink-500">
            {inProject ? <><span>Projects</span><ChevronRight size={11} /><span>TinyMod GC</span></> : <><span>Sales</span><ChevronRight size={11} /><span>Opportunities</span></>}
            <ChevronRight size={11} /><span className="font-medium text-ink-800">{PROJECT_META.customer}</span>
            {!inProject && <><ChevronRight size={11} /><span className="font-medium text-ink-800">Estimate #{ORDER_FORM.number}</span></>}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-6 pb-3 pt-1.5">
            <h1 className="text-[22px] font-semibold leading-tight text-ink-950">{inProject ? PROJECT_META.customer : `Estimate #${ORDER_FORM.number}: ${PROJECT_META.customer}`}</h1>
            <Badge tone="brand">{PROJECT_META.jobNo}</Badge>
            <Badge>{PROJECT_META.model}</Badge>
            <Badge>{PROJECT_META.manufacturer}</Badge>
            {inProject ? <Badge tone="info">TinyMod is GC</Badge> : <Badge tone="ok">Signed</Badge>}
            <span className="text-2xs text-ink-500">{PROJECT_META.place} · PM {PROJECT_META.pm}</span>
          </div>
          {inProject && (
            <div className="flex items-center gap-1 overflow-x-auto px-4">
              {projectTabs.map(x => (
                <button key={x.key} onClick={() => setNav({ ...nav, screen: x.key })}
                  className={cn('relative whitespace-nowrap px-3 pb-2.5 pt-1 text-[13px]', nav.screen === x.key ? 'font-medium text-ink-950' : 'text-ink-500 hover:text-ink-800')}>
                  {x.label}
                  {nav.screen === x.key && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded bg-brand-400" />}
                </button>
              ))}
              <span className="ml-2 pb-2 text-2xs text-ink-400">Other project tabs (Home, Tasks, Files…) unchanged</span>
            </div>
          )}
        </div>

        <div className="px-6 py-5">
          {nav.screen === 'estimate' && <Estimate />}
          {nav.screen === 'budget' && <Budget />}
          {nav.screen === 'schedule' && <Schedule onOpenDraws={() => setNav({ screen: 'budget', budgetTab: 'draws' })} />}
          {nav.screen === 'coversheet' && (
            <div className="space-y-3">
              <div className="text-2xs text-ink-500">Merlin's project Cover Sheet tab shows the same panel as the estimate, so the Blue Sheet is still there after signing.</div>
              <BlueSheetPanel orderForm={estimateTotal} />
            </div>
          )}
        </div>

        <footer className="px-6 pb-8 text-2xs text-ink-400">
          Prototype built from TinyMod's sheets, the TinyMod budget template and project template in Merlin, and three calls. The homeowner is renamed;
          every amount is the source's own, and each chip names the sheet and cell. Changes here are not saved.
        </footer>
      </main>

      <Drawers />
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto rounded-lg bg-ink-950 px-3.5 py-2.5 text-[12.5px] leading-snug text-white shadow-lg">{t.text}</div>
        ))}
      </div>
    </div>
  )
}

function Sidebar({ inProject, onSales, onProjects }: { inProject: boolean; onSales: () => void; onProjects: () => void }) {
  const items = [
    { icon: BarChart3, label: 'Dashboard' },
    { icon: Users, label: 'Sales', active: !inProject, onClick: onSales },
    { icon: FolderKanban, label: 'Projects', active: inProject, onClick: onProjects },
    { icon: Boxes, label: 'Materials' },
    { icon: Wallet, label: 'Finance' },
    { icon: ShoppingBag, label: 'Orders' },
  ]
  return (
    <aside className="sticky top-0 hidden h-screen w-[200px] shrink-0 flex-col border-r border-line bg-white md:flex">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-400 text-white"><Sparkles size={14} /></span>
        <span className="text-[14px] font-semibold text-ink-950">Merlin AI</span>
      </div>
      <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">Main</div>
      {items.map(i => (
        <button key={i.label} onClick={i.onClick} disabled={!i.onClick}
          className={cn('relative flex items-center gap-3 px-4 py-[7px] text-left text-[13px]', i.active ? 'bg-ink-100 font-medium text-ink-950' : 'text-ink-600', i.onClick && !i.active && 'hover:bg-ink-50')}>
          {i.active && <span className="absolute left-0 top-0 h-full w-[3px] bg-brand-400" />}
          <i.icon size={15} className="text-ink-500" />{i.label}
        </button>
      ))}
      <div className="mx-3 mt-4 rounded-lg border border-line bg-ink-50 p-2.5 text-2xs leading-snug text-ink-500">
        Click <b>Sales</b> for the estimate (order form + Blue Sheet), <b>Projects</b> for the budget, draws and schedule.
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-line px-3 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-400 text-[11px] font-bold text-white">ES</span>
        <div className="leading-tight">
          <div className="text-[13px] font-medium text-ink-950">Eric</div>
          <div className="text-2xs text-ink-500">Tiny Mod Living</div>
        </div>
      </div>
    </aside>
  )
}
