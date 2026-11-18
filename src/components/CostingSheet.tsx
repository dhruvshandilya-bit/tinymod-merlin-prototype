import React, { useState } from 'react'
import { AlertTriangle, Download, EyeOff, Info, Link2, SlidersHorizontal } from 'lucide-react'
import { useStore } from '../lib/store'
import { COST_CODES, contingencyOriginal, gcBase, inLoan, lineDrawn, resolve, type Line, type Stage } from '../lib/budget'
import { calcBlue, serviceAmount } from '../lib/blue'
import { cents, cn, money, pct } from '../lib/util'
import { Badge, Button, Callout, NumInput } from './ui'
import { exportCosting } from '../lib/export'
import { BLUE_REFS, type StepStatus } from '../data/job'
import { Q, Src } from './refs'

const STAGE: Record<Stage, { label: string; tone: string }> = {
  rough: { label: 'Rough', tone: 'neutral' },
  bid: { label: 'Bid', tone: 'info' },
  final: { label: 'Final', tone: 'ok' },
}
const nextStage: Record<Stage, Stage> = { rough: 'bid', bid: 'final', final: 'rough' }

export const STATUS: Record<StepStatus, { label: string; dot: string }> = {
  not_started: { label: 'Not started', dot: 'bg-ink-300' },
  in_progress: { label: 'In progress', dot: 'bg-warn-500' },
  done: { label: 'Done', dot: 'bg-ok-500' },
  na: { label: 'N/A', dot: 'bg-ink-200 ring-1 ring-ink-300' },
}

/** The project Budget tab's table (Budget Sections in Merlin), seeded from TinyMod's template and filled from the PM and draw sheets. */
export function CostingSheet() {
  const { project, setProject, steps, blue, updateLine, fundFromContingency } = useStore()
  const [showBase, setShowBase] = useState(false)
  const lines = resolve(project)
  const drawn = lineDrawn(project)
  const stepById = Object.fromEntries(steps.map(s => [s.id, s]))
  const covered: Record<string, number> = {}
  for (const x of lines) if (x.kind === 'item' && x.coversId) covered[x.coversId] = (covered[x.coversId] ?? 0) + x.approved
  const overBy = (l: Line) =>
    inLoan(l) && !['gcfee', 'contingency', 'item'].includes(l.kind) ? Math.max(0, cents(l.amount - l.approved - (covered[l.id] ?? 0))) : 0
  const cont = contingencyOriginal(project)
  const groups = Object.keys(COST_CODES).map(code => ({ code, name: COST_CODES[code], lines: lines.filter(l => l.code === code) }))
  const loanLines = lines.filter(inLoan)
  const tot = {
    amount: cents(loanLines.reduce((a, l) => a + l.amount, 0)),
    approved: cents(loanLines.reduce((a, l) => a + l.approved, 0)),
    paid: cents(loanLines.reduce((a, l) => a + l.paid, 0)),
    drawn: cents(loanLines.reduce((a, l) => a + (drawn[l.id]?.drawn ?? 0), 0)),
  }
  const b = calcBlue(blue)
  const hidden = [
    { name: 'Modular Wholesale Cost', v: blue.wholesale, refs: BLUE_REFS.wholesale },
    { name: 'Uni-Frame', v: blue.uniFrame, refs: BLUE_REFS.uniFrame },
    ...blue.services.map(s => ({ name: s.name, v: serviceAmount(blue, s), refs: BLUE_REFS[s.id] ?? [] })),
    { name: 'TinyMod Margin', v: b.margin, refs: BLUE_REFS.margin },
    { name: 'One-Off Project', v: b.oneOff, refs: BLUE_REFS.oneOff },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <Callout icon={<Info size={14} />} className="max-w-3xl flex-1">
          The costing sheet is the project's Budget tab. Line names and cost codes come from the TinyMod template already in Merlin <Src refs={{ s: 'TPL' }} />.
          The amounts come from the PM sheet <Src refs={{ s: 'PM', c: 'col E' }} /> and the draw sheet <Src refs={{ s: 'DRAW', c: 'col C' }} />.
          Each line's status comes from its schedule task.
        </Callout>
        <Button variant="outline" onClick={() => exportCosting(project, steps)}><Download size={13} /> Export to Excel</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[1180px] border-collapse">
          <thead>
            <tr>
              {['Cost code / line', 'Task', 'Contractor', 'Stage', 'Total est. (bid)', 'Bank approved', 'Actuals (paid)', 'Drawn', 'Available', ''].map((h, i) => (
                <th key={i} className={cn('border-b border-line bg-ink-50 px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-ink-500', i >= 4 && i <= 8 && 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(g => {
              const sub = g.lines.filter(inLoan)
              return (
                <React.Fragment key={g.code}>
                  <tr className="bg-ink-50/60">
                    <td colSpan={4} className="border-b border-line px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-600">
                      <span className="mr-2 rounded bg-white px-1.5 py-0.5 text-ink-500 ring-1 ring-line">{g.code}</span>{g.name}
                    </td>
                    <td className="border-b border-line px-3 py-1.5 text-right text-2xs font-semibold tnum text-ink-600">{money(sub.reduce((a, l) => a + l.amount, 0))}</td>
                    <td className="border-b border-line px-3 py-1.5 text-right text-2xs font-semibold tnum text-ink-600">{money(sub.reduce((a, l) => a + l.approved, 0))}</td>
                    <td colSpan={4} className="border-b border-line" />
                  </tr>
                  {g.lines.map(l => (
                    <Row key={l.id} l={l} step={l.stepId ? stepById[l.stepId] : undefined} gap={overBy(l)} drawn={drawn[l.id]?.drawn ?? 0}
                      onPatch={p => updateLine(l.id, p)}
                      onFund={amt => fundFromContingency(l.id, amt)}
                      extra={l.kind === 'gcfee' ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-ink-500">
                          <NumInput percent value={project.gcRate} onChange={v => setProject(p => ({ ...p, gcRate: v }))} width="w-16" className="rounded-md bg-ink-50" />
                          <span>of {money(gcBase(project, 'approved'))}</span>
                          <button onClick={() => setShowBase(s => !s)} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-brand-400 hover:bg-brand-50">
                            <SlidersHorizontal size={11} /> {project.lines.filter(x => x.gcBase && x.approved).length} lines in the base
                          </button>
                        </div>
                      ) : l.kind === 'contingency' ? (
                        <div className="mt-1 text-2xs text-ink-500">Loan − every other approved line. Original {money(cont.original)}, used {money(cont.used)}, left {money(cont.remaining)}.</div>
                      ) : null}
                    />
                  ))}
                  {g.code === '8000' && showBase && (
                    <tr>
                      <td colSpan={10} className="border-b border-line bg-brand-50/40 px-4 py-3">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-2xs font-semibold uppercase tracking-wide text-brand-500">
                          GC fee base: the lines TinyMod charges the fee on <Q ids="Q3" />
                        </div>
                        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                          {project.lines.filter(x => inLoan(x) && x.approved && !['gcfee', 'contingency', 'item'].includes(x.kind)).map(x => (
                            <label key={x.id} className="flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-700">
                              <input type="checkbox" checked={x.gcBase} onChange={e => updateLine(x.id, { gcBase: e.target.checked })} className="accent-brand-400" />
                              <span className="truncate"><span className="text-ink-400">{x.code}</span> {x.name}</span>
                              <span className="ml-auto tnum text-ink-500">{money(x.approved, 0)}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1 text-2xs text-ink-500">
                          Ticked: the lines in the sheet's formula <Src refs={{ s: 'PM', c: 'E18', note: '=SUM(E21,E25:E46,E48:E60)*10%' }} />.
                          Merlin's fee row can only take whole cost codes <Src refs={{ s: 'TPL', c: 'GC_FEE' }} />, which gives a different number.
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
            <tr className="bg-brand-50/50">
              <td colSpan={10} className="border-b border-line px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-brand-500">
                <span className="mr-2 rounded bg-white px-1.5 py-0.5 ring-1 ring-brand-200">9000</span>Margin & Internal
                <span className="ml-2 inline-flex items-center gap-1 normal-case"><EyeOff size={11} /> hidden from the customer · not in contract</span>
                <Q ids="Q17" className="ml-2" />
              </td>
            </tr>
            {hidden.map(h => (
              <tr key={h.name} className="bg-brand-50/20 text-ink-600">
                <td className="border-b border-line px-3 py-1.5 text-[13px]">
                  <div className="font-medium">{h.name}</div>
                  <Src refs={h.refs} />
                </td>
                <td colSpan={3} className="border-b border-line px-3 py-1.5 text-2xs text-ink-400">Copied from the estimate's Blue Sheet at signing</td>
                <td className="border-b border-line px-3 py-1.5 text-right text-[13px] tnum">{money(h.v)}</td>
                <td colSpan={5} className="border-b border-line" />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-ink-50">
              <td colSpan={4} className="px-3 py-2.5 text-[13px] font-semibold text-ink-950">Total in the loan <Src refs={{ s: 'DRAW', c: 'C40' }} /></td>
              <td className="px-3 py-2.5 text-right text-[13px] font-semibold tnum">{money(tot.amount)}</td>
              <td className={cn('px-3 py-2.5 text-right text-[13px] font-semibold tnum', tot.approved !== project.loan && 'text-danger-600')}>{money(tot.approved)}</td>
              <td className="px-3 py-2.5 text-right text-[13px] font-semibold tnum">{money(tot.paid)}</td>
              <td className="px-3 py-2.5 text-right text-[13px] font-semibold tnum">{money(tot.drawn)}</td>
              <td className="px-3 py-2.5 text-right text-[13px] font-semibold tnum">{money(tot.approved - tot.drawn)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function Row({ l, step, gap, drawn, onPatch, onFund, extra }: {
  l: Line; step?: any; gap: number; drawn: number; onPatch: (p: Partial<Line>) => void; onFund: (n: number) => void; extra?: React.ReactNode
}) {
  const computed = l.kind === 'gcfee' || l.kind === 'contingency'
  const outside = !inLoan(l)
  const empty = !computed && l.amount === 0 && l.approved === 0
  const over = gap > 0.005
  return (
    <tr className={cn('group', (outside || empty) && 'text-ink-500', outside && 'bg-ink-50/40', l.kind === 'item' && 'bg-warn-50/40')}>
      <td className="border-b border-line px-3 py-2 align-top">
        <div className={cn('flex flex-wrap items-center gap-1.5 text-[13px]', empty ? 'text-ink-500' : 'font-medium text-ink-900')}>
          {l.name}
          {outside && <Badge>Not in loan</Badge>}
          {l.kind === 'item' && <Badge tone="warn">From contingency</Badge>}
          {empty && <span className="text-2xs font-normal text-ink-400">template line, $0 on this job</span>}
          <Q ids={l.qs} />
        </div>
        <Src refs={l.refs} className="mt-0.5" />
        {extra}
        {l.note && !empty && <div className="mt-0.5 text-2xs text-ink-400">{l.note}</div>}
        {over && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-warn-700">
            <AlertTriangle size={11} /> {money(gap)} over what the bank approved.
            <button onClick={() => onFund(gap)} className="rounded bg-warn-500 px-1.5 py-0.5 font-medium text-white hover:bg-warn-600">Pay from contingency</button>
          </div>
        )}
      </td>
      <td className="whitespace-nowrap border-b border-line px-3 py-2 align-top text-2xs text-ink-500">
        {step ? (
          <span className="inline-flex items-center gap-1.5" title={step.name}>
            <span className={cn('h-2 w-2 rounded-full', STATUS[step.status as StepStatus].dot)} />
            {step.no !== '—' ? step.no : <Link2 size={11} />}
            <span className="text-ink-400">{STATUS[step.status as StepStatus].label}</span>
          </span>
        ) : '—'}
      </td>
      <td className="border-b border-line px-3 py-2 align-top text-2xs text-ink-600">{l.contractor ?? ''}</td>
      <td className="border-b border-line px-3 py-2 align-top">
        {!empty && (
          <button disabled={computed} onClick={() => onPatch({ stage: nextStage[l.stage] })} title={!computed ? 'Click: rough → bid → final' : undefined}>
            <Badge tone={STAGE[l.stage].tone}>{STAGE[l.stage].label}</Badge>
          </button>
        )}
      </td>
      <td className="border-b border-line px-2 py-1.5 text-right align-top">
        {computed ? <span className="pr-1.5 text-[13px] tnum text-ink-700">{money(l.amount)}</span>
          : <NumInput value={l.amount} onChange={v => onPatch({ amount: v })} />}
      </td>
      <td className="border-b border-line px-2 py-1.5 text-right align-top">
        {outside ? <span className="pr-1.5 text-2xs text-ink-400">Invoiced separately</span>
          : computed || l.kind === 'item' ? <span className="pr-1.5 text-[13px] tnum text-ink-700">{money(l.approved)}</span>
          : <NumInput value={l.approved} onChange={v => onPatch({ approved: v })} />}
      </td>
      <td className="border-b border-line px-2 py-1.5 text-right align-top">
        <NumInput value={l.paid} onChange={v => onPatch({ paid: v })} />
      </td>
      <td className="border-b border-line px-3 py-2 text-right align-top text-[13px] tnum text-ink-700">{outside ? '' : money(drawn)}</td>
      <td className="border-b border-line px-3 py-2 text-right align-top text-[13px] tnum text-ink-800">{outside ? '' : money(l.approved - drawn)}</td>
      <td className="border-b border-line px-2 py-2 align-top" />
    </tr>
  )
}
