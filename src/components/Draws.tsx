import React from 'react'
import { AlertTriangle, CheckCircle2, Download, Info, Lock, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { allocate, contingencyOriginal, drawSummaries, houseDeposit, inLoan, lineDrawn, padTo, resolve, warnings, type Alloc, type Draw, type DrawStatus, type Line } from '../lib/budget'
import { cents, cn, money, pct, shortDate } from '../lib/util'
import { Badge, Button, Callout, NumInput } from './ui'
import { Q, Src } from './refs'
import { exportDraws } from '../lib/export'

const STATUS_TONE: Record<DrawStatus, string> = { planned: 'neutral', requested: 'info', funded: 'ok' }
const TODAY = '2026-11-18'

export function Draws() {
  const { project, setProject, setDraws, steps, toast, updateLine } = useStore()
  const editable = true
  const n = project.draws.length
  // Template lines with no money on this job stay on the Budget tab but add nothing to a draw sheet.
  const lines = resolve(project).filter(l => inLoan(l) && (l.approved !== 0 || l.kind === 'contingency'))
  const al = allocate(project)
  const dr = lineDrawn(project)
  const sums = drawSummaries(project)
  const warns = warnings(project).filter(w => !w.lineId)
  const cont = contingencyOriginal(project)
  const dep = houseDeposit(project)
  const stepById = Object.fromEntries(steps.map(s => [s.id, s]))
  const trackSum = padTo(project.track, n).reduce((a, b) => a + b, 0)

  const patchDraw = (i: number, patch: Partial<Draw>) => setDraws(project.draws.map((d, k) => (k === i ? { ...d, ...patch } : d)))

  const advance = (i: number) => {
    const d = project.draws[i]
    if (d.status === 'planned') { patchDraw(i, { status: 'requested' }); toast(`${d.name} requested from ${project.bank}: ${money(sums[i].allocated)}.`) }
    else if (d.status === 'requested') {
      patchDraw(i, { status: 'funded', date: TODAY })
      toast(`${d.name} funded. Merlin raised one invoice to ${project.bank} for ${money(sums[i].allocated)} with ${sums[i].lines} lines tagged by cost code, so the budget's Drawn and Available columns are up to date.`)
    }
  }

  const setAlloc = (l: Line, value: string) => {
    let alloc: Alloc
    if (value.startsWith('pin:')) alloc = { mode: 'pin', draw: +value.slice(4) }
    else if (value === 'track') alloc = { mode: 'track' }
    else if (value === 'house') alloc = { mode: 'house' }
    else if (value === 'split') alloc = { mode: 'split', pct: (al[l.id] ?? []).map(v => (l.approved ? v / l.approved : 0)) }
    else alloc = { mode: 'none' }
    updateLine(l.id, { alloc })
  }

  const useTrackForSite = () => {
    setProject(p => ({ ...p, lines: p.lines.map(l => (l.kind === 'construction' && !(dr[l.id]?.lockedDraws.length) ? { ...l, alloc: { mode: 'track' } } : l)) }))
    toast('Every site line not drawn yet now follows the construction track.')
  }

  const tryPreset = () => {
    // Eric's typical bank (1 Oct): 35% of the house + 10% of construction at closing, then 40 / 40 / 10, house balance in any draw.
    const draws: Draw[] = [
      { id: 'p1', name: 'Draw 1: closing', capPct: 0, status: 'planned', stepId: 'x-close' },
      { id: 'p2', name: 'Draw 2', capPct: 0, status: 'planned', stepId: 's11' },
      { id: 'p3', name: 'Draw 3', capPct: 0, status: 'planned', stepId: 'x-ship' },
      { id: 'p4', name: 'Draw 4: completion', capPct: 0, status: 'planned', stepId: 'x-co' },
    ]
    setProject(p => {
      const next = {
        ...p, draws, track: [0.1, 0.4, 0.4, 0.1], house: { depositPct: 0.35, depositDraw: 0, balanceDraw: 2 },
        lines: p.lines.map(l => (['construction', 'gcfee'].includes(l.kind) ? { ...l, alloc: { mode: 'track' } as Alloc } : l.id === 'transport' ? { ...l, alloc: { mode: 'pin', draw: 2 } as Alloc } : l)),
      }
      // Bank % per draw = whatever lands in it, so the caps line up with this bank's rule.
      const s = drawSummaries(next)
      return { ...next, draws: next.draws.map((d, i) => ({ ...d, capPct: +(s[i].allocated / p.loan).toFixed(4) })) }
    })
    toast('Switched to the 35% house + 10/40/40/10 construction pattern, with 4 draws and nothing funded yet. Use Reset to go back to the sheet as sent.')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <Callout icon={<Info size={14} />} className="max-w-3xl flex-1">
          This is the bank's draw sheet <Src refs={{ s: 'DRAW' }} />, built from the same budget lines, as a new tab on the Budget page.
          Set the draws and the rules once and Merlin works out every line's amount in each draw. Each line can only be drawn up to its approved amount.
          On the original sheet, <b>rock blasting</b> and <b>dampproofing</b> went into both draw 1 and draw 2 <Src refs={[{ s: 'DRAW', c: 'E18 & F18' }, { s: 'DRAW', c: 'E22 & F22' }]} />,
          which drew {money(20650)} more than the bank approved. Here each is drawn once <Q ids="Q6" />. The rules come from the 1 Oct call <Src refs={{ s: 'C1001', c: '41:34', note: '35% of the house, then a % of construction per draw; the house balance can come in any draw' }} />.
        </Callout>
        <Button variant="outline" onClick={() => exportDraws(project)}><Download size={13} /> Export to Excel</Button>
      </div>

      {warns.length > 0 && (
        <div className="space-y-1.5">
          {warns.map((w, i) => (
            <Callout key={i} tone={w.level === 'error' ? 'danger' : 'warn'} icon={<AlertTriangle size={14} />}>{w.text}</Callout>
          ))}
        </div>
      )}

      {/* Setup */}
      <div className="rounded-xl border border-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div>
            <div className="text-[13px] font-semibold text-ink-950">Draw setup</div>
            <div className="text-2xs text-ink-500">Every bank is different. Set this once per project from the bank's approval letter.</div>
          </div>
          {editable && (
            <button onClick={tryPreset} className="ml-auto inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-2xs font-medium text-brand-500 hover:bg-brand-100">
              <Sparkles size={11} /> Try the 35% house · 10/40/40/10 pattern
            </button>
          )}
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[13px]">
              <span className="text-ink-600">Loan</span>
              <NumInput value={project.loan} onChange={v => setProject(p => ({ ...p, loan: v }))} disabled={!editable} width="w-32" className="rounded-md bg-ink-50" />
              <span className="text-ink-600">Lender</span>
              <input value={project.bank} disabled={!editable} onChange={e => setProject(p => ({ ...p, bank: e.target.value }))}
                className="h-7 w-44 rounded-md border border-line px-2 text-[13px] disabled:bg-ink-50" />
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-2xs uppercase tracking-wide text-ink-500">
                  <th className="py-1 pr-2 font-semibold">Draw</th><th className="py-1 pr-2 text-right font-semibold">Bank %</th>
                  <th className="py-1 pr-2 text-right font-semibold">Bank value</th><th className="py-1 pr-2 font-semibold">Released when <Q ids="Q8" /></th>
                  <th className="py-1 pr-2 font-semibold">Status</th><th />
                </tr>
              </thead>
              <tbody>
                {project.draws.map((d, i) => (
                  <tr key={d.id} className="border-t border-line">
                    <td className="py-1 pr-2">
                      <input value={d.name} disabled={!editable} onChange={e => patchDraw(i, { name: e.target.value })}
                        className="h-7 w-36 rounded-md border border-transparent px-1.5 hover:border-line focus:border-brand-300 focus:outline-none disabled:bg-transparent" />
                    </td>
                    <td className="py-1 pr-2 text-right">
                      <NumInput percent value={d.capPct} disabled={!editable} onChange={v => patchDraw(i, { capPct: v })} width="w-20" />
                      <div><Src refs={d.refs} /></div>
                    </td>
                    <td className="py-1 pr-2 text-right tnum text-ink-700">{money(sums[i].cap, 0)}</td>
                    <td className="py-1 pr-2">
                      <select value={d.stepId ?? ''} disabled={!editable} onChange={e => patchDraw(i, { stepId: e.target.value || undefined })}
                        className="h-7 w-full max-w-[220px] rounded-md border border-line bg-white px-1 text-2xs text-ink-700 disabled:bg-ink-50">
                        <option value="">Entered by hand</option>
                        {steps.filter(s => !s.parent).map(s => <option key={s.id} value={s.id}>{s.no !== '—' ? `${s.no} ` : ''}{s.name}</option>)}
                      </select>
                    </td>
                    <td className="py-1 pr-2">
                      <select value={d.status} disabled={!editable} onChange={e => patchDraw(i, { status: e.target.value as DrawStatus, date: e.target.value === 'funded' ? d.date ?? TODAY : d.date })}
                        className="h-7 rounded-md border border-line bg-white px-1 text-2xs text-ink-700 disabled:bg-ink-50">
                        <option value="planned">Planned</option><option value="requested">Requested</option><option value="funded">Funded</option>
                      </select>
                    </td>
                    <td className="py-1 text-right">
                      {editable && n > 1 && d.status !== 'funded' && (
                        <button onClick={() => setDraws(project.draws.filter((_, k) => k !== i))} className="text-ink-300 hover:text-danger-500"><Trash2 size={12} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editable && n < 8 && (
              <button onClick={() => setDraws([...project.draws, { id: `d${Date.now()}`, name: `Draw ${n + 1}`, capPct: 0, status: 'planned' }])}
                className="mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs text-brand-400 hover:bg-brand-50"><Plus size={11} /> Add draw (up to 8)</button>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-line p-3">
              <div className="text-2xs font-semibold uppercase tracking-wide text-ink-500">House rule</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-700">
                Deposit
                <NumInput percent value={project.house.depositPct} disabled={!editable} onChange={v => setProject(p => ({ ...p, house: { ...p.house, depositPct: v } }))} width="w-16" className="rounded-md bg-ink-50" />
                of {money(dep.basis, 0)} in
                <DrawPick value={project.house.depositDraw} draws={project.draws} disabled={!editable} onChange={v => setProject(p => ({ ...p, house: { ...p.house, depositDraw: v } }))} />
                and the balance in
                <DrawPick value={project.house.balanceDraw} draws={project.draws} disabled={!editable} onChange={v => setProject(p => ({ ...p, house: { ...p.house, balanceDraw: v } }))} />
              </div>
              <div className="mt-1 text-2xs text-ink-500">Deposit {money(dep.deposit, 0)}, rounded to the dollar like the sheet. The balance can go in whichever draw the house ships in.</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <div className="flex items-center text-2xs font-semibold uppercase tracking-wide text-ink-500">
                Construction track
                <span className={cn('ml-auto normal-case', Math.abs(trackSum - 1) > 1e-6 ? 'text-danger-600' : 'text-ink-400')}>adds up to {pct(trackSum)}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {project.draws.map((d, i) => (
                  <span key={d.id} className="inline-flex items-center gap-1 text-2xs text-ink-500">
                    {i + 1}
                    <NumInput percent value={project.track[i] ?? 0} disabled={!editable}
                      onChange={v => setProject(p => ({ ...p, track: padTo(p.track, n).map((x, k) => (k === i ? v : x)) }))} width="w-16" className="rounded-md bg-ink-50" />
                  </span>
                ))}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-2xs text-ink-500">
                Lines set to "Construction track" are split by these %.
                {editable && <button onClick={useTrackForSite} className="rounded px-1.5 py-0.5 font-medium text-brand-400 hover:bg-brand-50">Use it for every site line</button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full border-collapse" style={{ minWidth: 700 + n * 140 }}>
          <thead>
            <tr>
              <Hd className="min-w-[220px]"><span className="inline-flex items-center gap-1.5">Line <Q ids="Q5" /></span></Hd>
              <Hd>How it's drawn</Hd>
              <Hd right className="whitespace-nowrap">Bank approved</Hd>
              {project.draws.map((d, i) => {
                const when = d.status === 'funded' && d.date ? `Funded ${shortDate(d.date)}` : d.stepId && stepById[d.stepId] ? `When: ${stepById[d.stepId].name}` : 'Entered by hand'
                return (
                  <Hd key={d.id} right className={cn('min-w-[132px] max-w-[170px]', d.status === 'funded' && 'bg-ok-50')}>
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap normal-case">
                      <span className="text-[12px] font-semibold text-ink-900">{d.name}</span>
                      <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                    </div>
                    <div title={when} className="mt-0.5 truncate text-[10px] font-normal normal-case text-ink-400">{when}</div>
                  </Hd>
                )
              })}
              <Hd right className="whitespace-nowrap">Total drawn</Hd>
              <Hd right>Balance</Hd>
            </tr>
            <tr className="bg-ink-50/60 text-2xs">
              <td className="border-b border-line px-3 py-1.5 text-ink-500" colSpan={3}>Bank value ({project.draws.map(d => pct(d.capPct, 0)).join(' / ')} of {money(project.loan, 0)})</td>
              {sums.map((s, i) => <td key={i} className="border-b border-line px-3 py-1.5 text-right tnum text-ink-600">{money(s.cap)}</td>)}
              <td className="border-b border-line" colSpan={2} />
            </tr>
            <tr className="bg-ink-50/60 text-2xs">
              <td className="border-b border-line px-3 py-1.5 text-ink-500" colSpan={3}>In this draw / room left</td>
              {sums.map((s, i) => (
                <td key={i} className="border-b border-line px-3 py-1.5 text-right tnum">
                  <div className="font-semibold text-ink-900">{money(s.allocated)}</div>
                  <div className={cn(s.headroom < 0 ? 'font-medium text-warn-700' : 'text-ok-700')}>
                    {s.headroom < 0 ? <><AlertTriangle size={10} className="mr-0.5 inline" />{money(-s.headroom)} over <Q ids="Q7" /></> : `${money(s.headroom)} left`}
                  </div>
                </td>
              ))}
              <td className="border-b border-line" colSpan={2} />
            </tr>
          </thead>
          <tbody>
            {lines.map(l => {
              const row = al[l.id] ?? []
              const locked = (dr[l.id]?.lockedDraws.length ?? 0) > 0
              const value = l.alloc.mode === 'pin' ? `pin:${l.alloc.draw}` : l.alloc.mode
              return (
                <tr key={l.id} className={cn(l.kind === 'contingency' && 'bg-ink-50/40', l.kind === 'item' && 'bg-warn-50/40')}>
                  <td className="border-b border-line px-3 py-1.5 text-[13px]">
                    <span className="mr-2 rounded bg-ink-100 px-1 py-0.5 text-[10px] text-ink-500">{l.code}</span>
                    <span className="font-medium text-ink-900">{l.name}</span> <Q ids={l.qs} />
                    <div><Src refs={l.refs?.filter(x => x.s === 'DRAW')} /></div>
                    {l.kind === 'contingency' && <div className="mt-0.5 text-2xs text-ink-500">Not drawn as a line. Overruns are paid from it as contingency items. Original {money(cont.original)}, used {money(cont.used)}.</div>}
                  </td>
                  <td className="border-b border-line px-3 py-1.5">
                    {l.kind === 'contingency' ? <span className="text-2xs text-ink-400">Held back</span> : (
                      <span className="inline-flex items-center gap-1">
                        <select value={value} disabled={!editable || locked} onChange={e => setAlloc(l, e.target.value)}
                          className="h-7 max-w-[170px] rounded-md border border-line bg-white px-1 text-2xs text-ink-700 disabled:bg-ink-50 disabled:text-ink-500">
                          {l.kind === 'house' && <option value="house">House rule</option>}
                          {project.draws.map((d, i) => <option key={d.id} value={`pin:${i}`}>All in {d.name}</option>)}
                          <option value="track">Construction track</option>
                          <option value="split">Custom split</option>
                        </select>
                        {locked && <span title="Part of this line is already in a funded draw, so its split is locked."><Lock size={11} className="text-ink-400" /></span>}
                      </span>
                    )}
                    {l.allocRef && (
                      <div className="mt-0.5"><Src refs={l.allocRef} /></div>
                    )}
                  </td>
                  <td className="border-b border-line px-3 py-1.5 text-right text-[13px] tnum text-ink-900">{money(l.approved)}</td>
                  {project.draws.map((d, i) => (
                    <td key={d.id} className={cn('border-b border-line px-3 py-1.5 text-right text-[13px] tnum', d.status === 'funded' && 'bg-ok-50/50')}>
                      {l.alloc.mode === 'split' && editable && !locked ? (
                        <div className="flex flex-col items-end">
                          <NumInput percent value={padTo(l.alloc.pct, n)[i]} width="w-16" className="rounded-md bg-ink-50"
                            onChange={v => updateLine(l.id, { alloc: { mode: 'split', pct: padTo((l.alloc as any).pct, n).map((x, k) => (k === i ? v : x)) } })} />
                          <span className="text-2xs text-ink-500">{row[i] ? money(row[i]) : ''}</span>
                        </div>
                      ) : row[i] ? <span className={cn(d.status === 'funded' ? 'text-ok-700' : 'text-ink-800')}>{money(row[i])}</span> : <span className="text-ink-300">·</span>}
                    </td>
                  ))}
                  <td className="border-b border-line px-3 py-1.5 text-right text-[13px] tnum text-ink-900">{money(dr[l.id]?.drawn ?? 0)}</td>
                  <td className={cn('border-b border-line px-3 py-1.5 text-right text-[13px] tnum', (dr[l.id]?.balance ?? 0) < 0 ? 'text-danger-600' : 'text-ink-700')}>{money(dr[l.id]?.balance ?? 0)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-ink-50">
              <td colSpan={2} className="px-3 py-2.5 text-[13px] font-semibold text-ink-950">Total</td>
              <td className="px-3 py-2.5 text-right text-[13px] font-semibold tnum">{money(cents(lines.reduce((a, l) => a + l.approved, 0)))}</td>
              {sums.map((s, i) => <td key={i} className="px-3 py-2.5 text-right text-[13px] font-semibold tnum">{money(s.allocated)}</td>)}
              <td className="px-3 py-2.5 text-right text-[13px] font-semibold tnum">{money(cents(lines.reduce((a, l) => a + (dr[l.id]?.drawn ?? 0), 0)))}</td>
              <td className="px-3 py-2.5 text-right text-[13px] font-semibold tnum">{money(cents(lines.reduce((a, l) => a + (dr[l.id]?.balance ?? 0), 0)))}</td>
            </tr>
            {editable && (
              <tr>
                <td colSpan={3} className="px-3 py-2.5 text-2xs text-ink-500">
                  Request a draw, then mark it funded when the bank pays. Funding raises the invoice to the bank <Q ids="Q4" />, linked to a payment milestone so the budget's
                  Drawn column fills <Src refs={{ s: 'CODE', c: 'BudgetService.kt:1009', note: 'Drawn only counts receivables linked to a payment milestone, and only cash received' }} />.
                </td>
                {project.draws.map((d, i) => (
                  <td key={d.id} className="px-3 py-2.5 text-right">
                    {d.status === 'funded'
                      ? <span className="inline-flex items-center gap-1 text-2xs font-medium text-ok-700"><CheckCircle2 size={12} /> Invoiced</span>
                      : <Button size="sm" variant={d.status === 'requested' ? 'default' : 'outline'} onClick={() => advance(i)}>{d.status === 'planned' ? 'Request' : 'Mark funded'}</Button>}
                  </td>
                ))}
                <td colSpan={2} />
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  )
}

const Hd = ({ children, right, className }: any) => (
  <th className={cn('border-b border-line bg-ink-50 px-3 py-2 align-bottom text-2xs font-semibold uppercase tracking-wide text-ink-500', right ? 'text-right' : 'text-left', className)}>{children}</th>
)

const DrawPick = ({ value, draws, onChange, disabled }: { value: number; draws: Draw[]; onChange: (v: number) => void; disabled?: boolean }) => (
  <select value={value} disabled={disabled} onChange={e => onChange(+e.target.value)}
    className="h-7 rounded-md border border-line bg-white px-1 text-2xs text-ink-700 disabled:bg-ink-50">
    {draws.map((d, i) => <option key={d.id} value={i}>{d.name}</option>)}
  </select>
)
