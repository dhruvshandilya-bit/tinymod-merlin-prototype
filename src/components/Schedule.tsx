import React from 'react'
import { ArrowRight, BellRing, Info, Landmark } from 'lucide-react'
import { useStore } from '../lib/store'
import { allocate, resolve } from '../lib/budget'
import { cn, money, shortDate } from '../lib/util'
import { Badge, Button, Callout } from './ui'
import { STATUS } from './CostingSheet'
import type { StepStatus } from '../data/job'
import { Q, Src } from './refs'

const day = (iso: string) => new Date(iso + 'T00:00:00').getTime() / 86400000

export function Schedule({ onOpenDraws }: { onOpenDraws: () => void }) {
  const { steps, setStepStatus, project } = useStore()
  const editable = true
  const lines = resolve(project)
  const al = allocate(project)
  const lineByStep: Record<string, typeof lines> = {}
  for (const l of lines) if (l.stepId) (lineByStep[l.stepId] ??= []).push(l)
  const drawByStep = Object.fromEntries(project.draws.map((d, i) => [d.stepId, { d, i }]).filter(([k]) => k))
  const ready = project.draws.map((d, i) => ({ d, i })).filter(({ d }) => d.status === 'planned' && d.stepId && steps.find(s => s.id === d.stepId)?.status === 'done')
  const min = Math.min(...steps.map(s => day(s.start)))
  const max = Math.max(...steps.map(s => day(s.end))) + 1
  const span = max - min

  return (
    <div className="space-y-3">
      <Callout icon={<Info size={14} />}>
        Your project template, as it sits in Merlin <Src refs={[{ s: 'SCHED' }, { s: 'C1010', c: '17:21' }]} />. Each step links to its budget line.
        Rows marked <b>Suggested</b> <Q ids="Q16" /> give the house and the draws a step to hang off; when a draw's step is done, Merlin says it's ready to request.
      </Callout>

      {ready.map(({ d, i }) => (
        <Callout key={d.id} tone="ok" icon={<BellRing size={14} />}>
          <div className="flex flex-wrap items-center gap-2">
            <span><b>{d.name}</b> is ready to request: "{steps.find(s => s.id === d.stepId)!.name}" is done.</span>
            <Button size="sm" onClick={onOpenDraws}>Open draws <ArrowRight size={12} /></Button>
          </div>
        </Callout>
      ))}

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr>
              {['#', 'Task', 'Budget line', 'Start', 'End', 'Status', 'Assignee', 'Timeline'].map(h => (
                <th key={h} className={cn('border-b border-line bg-ink-50 px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-ink-500',
                  h === 'Task' && 'min-w-[230px]', h === 'Budget line' && 'min-w-[250px]')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map(s => {
              const ls = lineByStep[s.id] ?? []
              const draw = drawByStep[s.id] as any
              return (
                <tr key={s.id} className={cn(s.suggested && 'bg-brand-50/30', s.status === 'na' && 'text-ink-400')}>
                  <td className="whitespace-nowrap border-b border-line px-3 py-1.5 text-2xs text-ink-500">{s.no}</td>
                  <td className={cn('border-b border-line px-3 py-1.5 text-[13px]', s.parent && 'pl-8')}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn('font-medium', s.status === 'na' ? 'text-ink-400 line-through' : 'text-ink-900')}>{s.name}</span>
                      {s.suggested && <><Badge tone="brand">Suggested</Badge><Q ids="Q16" /></>}
                      {draw && <Badge tone="info"><Landmark size={10} /> Releases {draw.d.name}</Badge>}
                    </div>
                  </td>
                  <td className="border-b border-line px-3 py-1.5 text-2xs text-ink-600">
                    {ls.length ? ls.map(l => (
                      <div key={l.id} className="flex items-center gap-1.5">
                        <span className="rounded bg-ink-100 px-1 text-[10px] text-ink-500">{l.code}</span>
                        <span className="max-w-[150px] truncate" title={l.name}>{l.name}</span>
                        <span className="ml-auto tnum text-ink-500">{money(l.approved, 0)}</span>
                        {(al[l.id] ?? []).map((v, i) => v ? <span key={i} className="rounded bg-ink-50 px-1 text-[10px] text-ink-500">D{i + 1}</span> : null)}
                      </div>
                    )) : <span className="text-ink-300">No cost</span>}
                  </td>
                  <td className="whitespace-nowrap border-b border-line px-3 py-1.5 text-2xs tnum text-ink-600">{shortDate(s.start)}</td>
                  <td className="whitespace-nowrap border-b border-line px-3 py-1.5 text-2xs tnum text-ink-600">{shortDate(s.end)}</td>
                  <td className="border-b border-line px-3 py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', STATUS[s.status].dot)} />
                      <select value={s.status} disabled={!editable} onChange={e => setStepStatus(s.id, e.target.value as StepStatus)}
                        className="h-7 rounded-md border border-transparent bg-transparent text-2xs text-ink-700 hover:border-line disabled:hover:border-transparent">
                        {(Object.keys(STATUS) as StepStatus[]).map(k => <option key={k} value={k}>{STATUS[k].label}</option>)}
                      </select>
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-b border-line px-3 py-1.5 text-2xs text-ink-600">{s.assignee ?? <span className="text-ink-300">No assignee</span>}</td>
                  <td className="w-[130px] border-b border-line px-3 py-1.5">
                    <div className="relative h-2 rounded bg-ink-50">
                      <div className={cn('absolute top-0 h-2 rounded', s.status === 'done' ? 'bg-ok-500' : s.status === 'in_progress' ? 'bg-warn-500' : s.suggested ? 'bg-brand-200' : 'bg-brand-300')}
                        style={{ left: `${((day(s.start) - min) / span) * 100}%`, width: `${Math.max(1.2, ((day(s.end) - day(s.start) + 1) / span) * 100)}%` }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
