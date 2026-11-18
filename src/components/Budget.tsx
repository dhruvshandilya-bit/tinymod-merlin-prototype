import React from 'react'
import { EyeOff, MessageSquare, FileDiff } from 'lucide-react'
import { useStore, type BudgetTab } from '../lib/store'
import { gcBase, totals, resolve } from '../lib/budget'
import { cn, money } from '../lib/util'
import { NumInput } from './ui'
import { CostingSheet } from './CostingSheet'
import { Draws } from './Draws'
import { Q, Src } from './refs'

/** Project → Budget, laid out like Merlin's budget page: summary, then its tabs. Draws is the one new tab. */
export function Budget() {
  const { project, setProject, blue, nav, setBudgetTab } = useStore()
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
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
        <Tile label="Loan" v={money(project.loan, 0)} sub={project.bank} refs={{ s: 'DRAW', c: 'C40' }} />
        <Tile label="Budget" v={money(t.approved, 0)} sub={t.approved === project.loan ? 'Equals the loan' : 'Does not equal the loan'} />
        <Tile label="Drawn" v={money(t.drawn, 0)} sub={`${project.draws.filter(d => d.status === 'funded').length} of ${project.draws.length} draws funded`} />
        <Tile label="Left to draw" v={money(project.loan - t.drawn, 0)} sub="Loan − drawn" />
        <div className="bg-white px-4 py-3">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">GC fee <Q ids="Q3" /></div>
          <div className="mt-0.5 flex items-center gap-1">
            <NumInput percent value={project.gcRate} onChange={v => setProject(p => ({ ...p, gcRate: v }))} width="w-14" className="-ml-1 rounded-md bg-ink-50" />
            <span className="text-[16px] font-semibold tnum text-ink-950">{money(gc.approved, 0)}</span>
          </div>
          <div className="text-2xs text-ink-500">of {money(gcBase(project, 'approved'), 0)} site work <Src refs={{ s: 'PM', c: 'E18' }} /></div>
        </div>
        <div className="bg-white px-4 py-3">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500"><EyeOff size={10} /> Merlin AI <Q ids="Q18" /></div>
          <div className="mt-0.5 text-[18px] font-semibold tnum text-ink-950">{money(0.01 * blue.wholesale, 0)}</div>
          <div className="text-2xs text-ink-500">Hidden · 1% of wholesale <Src refs={{ s: 'BLUEM', c: 'K30' }} /></div>
        </div>
      </div>

      <div className="flex items-end gap-1 border-b border-line">
        {tabs.map(x => (
          <button key={x.key} onClick={() => setBudgetTab(x.key)}
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
          Changes to the contract go here. An overrun inside the loan is paid from contingency on the Budget tab instead.
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
