import React from 'react'
import { EyeOff, MessageSquare, FileDiff } from 'lucide-react'
import { useStore, type BudgetTab } from '../lib/store'
import { gcBase, totals, resolve } from '../lib/budget'
import { cn, money } from '../lib/util'
import { NumInput } from './ui'
import { CostingSheet } from './CostingSheet'
import { Draws } from './Draws'
import { Q, Src } from './refs'

/** Project → Budget, laid out like Merlin's BudgetSections: hero metrics, Details, then outer tabs. Draws is the one new tab. */
export function Budget() {
  const { project, setProject, blue, nav, setNav } = useStore()
  const t = totals(project)
  const gc = resolve(project).find(l => l.kind === 'gcfee')!
  const tabs: { key: BudgetTab; label: string; isNew?: boolean }[] = [
    { key: 'budget', label: 'Budget' },
    { key: 'changeOrders', label: 'Change Orders' },
    { key: 'draws', label: 'Draws', isNew: true },
    { key: 'conversation', label: 'Conversation' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Loan" v={money(project.loan, 0)} refs={[{ s: 'DRAW', c: 'C40 / E42' }]} sub={`${project.bank} · edit in "Loan & contribution"`} />
        <Tile label="Total budget (bank approved)" v={money(t.approved)} sub={t.approved === project.loan ? 'Ties to the loan' : 'Does not tie to the loan'} refs={[{ s: 'DRAW', c: 'C40' }]} />
        <Tile label="Drawn" v={money(t.drawn)} sub="Paid draw invoices, by cost code" refs={[{ s: 'CODE', c: 'BudgetService Drawn' }]} />
        <Tile label="Available" v={money(project.loan - t.drawn)} sub="Loan − drawn" />
      </div>

      <div className="rounded-xl border border-line bg-white px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">
          Details <span className="font-normal normal-case text-ink-400">(the budget's existing Details panel; the GC fee editor is new)</span>
          <Src refs={{ s: 'CODE', c: 'BudgetHero.tsx:610-767' }} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-2xs text-ink-500">General contracting fee <Q ids="Q3" /></div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <NumInput percent value={project.gcRate} onChange={v => setProject(p => ({ ...p, gcRate: v }))} width="w-16" className="rounded-md bg-ink-50" />
              <span className="text-2xs text-ink-500">of {money(gcBase(project, 'approved'))} =</span>
              <span className="text-[14px] font-semibold tnum text-ink-950">{money(gc.approved)}</span>
            </div>
            <Src refs={[{ s: 'PM', c: 'E18' }, { s: 'TPL', c: 'GC_FEE 15%' }]} className="mt-0.5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-2xs text-ink-500"><EyeOff size={11} /> Merlin AI (hidden row) <Q ids="Q18" /></div>
            <div className="mt-0.5 text-[14px] font-semibold tnum text-ink-950">{money(0.01 * blue.wholesale)}</div>
            <div className="text-2xs text-ink-500">1% of TM wholesale {money(blue.wholesale, 0)}</div>
            <Src refs={[{ s: 'BLUEM', c: 'K30' }, { s: 'TPL', c: 'MERLIN_AI (1% of 2000)' }]} className="mt-0.5" />
          </div>
          <div>
            <div className="text-2xs text-ink-500">Margin mode</div>
            <div className="mt-0.5 text-[14px] font-semibold text-ink-950">Markup</div>
            <Src refs={{ s: 'CODE', c: 'V312 BUDGET_MARGIN_MODE' }} className="mt-0.5" />
          </div>
        </div>
      </div>

      <div className="flex items-end gap-1 border-b border-line">
        {tabs.map(x => (
          <button key={x.key} onClick={() => setNav({ ...nav, budgetTab: x.key })}
            className={cn('-mb-px flex items-center gap-1.5 rounded-t-lg border px-3.5 py-2 text-[13px]',
              nav.budgetTab === x.key ? 'border-line border-b-white bg-white font-medium text-ink-950' : 'border-transparent text-ink-500 hover:text-ink-800')}>
            {x.label}
            {x.isNew && <span className="rounded bg-brand-400 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">New</span>}
          </button>
        ))}
      </div>

      {nav.budgetTab === 'budget' && <CostingSheet />}
      {nav.budgetTab === 'draws' && <Draws />}
      {nav.budgetTab === 'changeOrders' && (
        <Placeholder icon={FileDiff} title="Change Orders (already in Merlin)">
          Overruns that change the contract go here. Overruns inside the loan are paid from contingency on the Budget tab.
        </Placeholder>
      )}
      {nav.budgetTab === 'conversation' && <Placeholder icon={MessageSquare} title="Conversation (already in Merlin)">The budget's comment thread.</Placeholder>}
    </div>
  )
}

const Tile = ({ label, v, sub, refs }: any) => (
  <div className="bg-white px-4 py-3">
    <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}<Src refs={refs} /></div>
    <div className="mt-0.5 text-[18px] font-semibold tnum text-ink-950">{v}</div>
    <div className="text-2xs text-ink-500">{sub}</div>
  </div>
)

const Placeholder = ({ icon: Icon, title, children }: any) => (
  <div className="grid place-items-center rounded-xl border border-dashed border-ink-300 bg-white py-14 text-center">
    <Icon size={20} className="text-ink-400" />
    <div className="mt-2 text-[13px] font-semibold text-ink-800">{title}</div>
    <div className="mt-1 max-w-md text-2xs text-ink-500">{children}</div>
  </div>
)
