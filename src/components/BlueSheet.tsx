import React from 'react'
import { ArrowRight, Download, Lock, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { calcBlue, serviceAmount, solveMargin, splitFromEstimate, type Service } from '../lib/blue'
import { gcBase, newId } from '../lib/budget'
import { cn, money, pct } from '../lib/util'
import { Button, NumInput } from './ui'
import { exportBlue } from '../lib/export'
import { BLUE_REFS } from '../data/job'
import { Q, Src } from './refs'

/**
 * The Blue Sheet as a TinyMod section of the estimate's Cover Sheet panel. Internal: the Cover Sheet never prints.
 * The estimate total is final (Q1), so the panel shows how that price splits, and the margin % is a "what if" for
 * adjusting the price.
 */
export function BlueSheetPanel({ orderForm }: { orderForm: number }) {
  const { blue, setBlue, project, setProject, toast } = useStore()
  const split = splitFromEstimate(blue, orderForm)
  const matchedPct = solveMargin({ ...blue, oneOffPct: 0 }, orderForm)
  // null = follow the estimate's price; a number = someone is trying another margin to adjust the price.
  const [tryPct, setTryPct] = React.useState<number | null>(null)
  const shownPct = tryPct ?? matchedPct
  const whatIf = calcBlue({ ...blue, marginPct: shownPct, oneOffPct: 0 })
  const adjusting = tryPct !== null && Math.abs(whatIf.retail - orderForm) > 0.005
  const set = (patch: Partial<typeof blue>) => setBlue(b => ({ ...b, ...patch }))
  const setSvc = (id: string, patch: Partial<Service>) => setBlue(b => ({ ...b, services: b.services.map(s => (s.id === id ? { ...s, ...patch } : s)) }))
  const svcQ: Record<string, string[]> = { viz: ['Q11'], mbi: ['Q11'], merlin: ['Q12', 'Q18'] }

  const rows: { label: string; v: number; refs?: any; payee?: string; q?: string[] }[] = [
    { label: 'Factory (TM wholesale)', v: blue.wholesale, refs: BLUE_REFS.wholesale },
    ...(blue.uniFrame ? [{ label: 'Uni-Frame', v: blue.uniFrame, refs: BLUE_REFS.uniFrame }] : []),
    { label: 'Sales tax', v: blue.salesTax, refs: BLUE_REFS.salesTax },
    ...(split.tariff ? [{ label: 'Tariff', v: split.tariff, refs: BLUE_REFS.tariff }] : []),
    ...blue.services.map(s => ({ label: s.name, v: serviceAmount(blue, s), payee: s.payee, refs: BLUE_REFS[s.id], q: svcQ[s.id] })),
  ]

  return (
    <div className="rounded-xl border border-brand-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-200 bg-brand-50/50 px-4 py-3">
        <Lock size={14} className="text-brand-400" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink-950">Cover Sheet · Blue Sheet <span className="font-normal text-ink-500">(TinyMod only, never printed)</span></div>
          <div className="text-2xs text-ink-500">How the final estimate splits: what goes to the factory, the services, Merlin, tax, and what's left for TinyMod.</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportBlue(blue, project.customer, orderForm)}><Download size={12} /> Export</Button>
      </div>

      <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-line">
        {/* Inputs */}
        <div className="divide-y divide-line">
          <In label="TinyMod wholesale (TM)" hint="From the factory quote." refs={BLUE_REFS.wholesale}>
            <NumInput value={blue.wholesale} onChange={v => set({ wholesale: v })} width="w-36" />
          </In>
          <In label="Uni-Frame" hint="Only if a Uni-Frame is used." refs={BLUE_REFS.uniFrame}>
            <NumInput value={blue.uniFrame} onChange={v => set({ uniFrame: v })} width="w-36" />
          </In>
          <div className="px-4 py-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-900">Project services <span className="text-2xs font-normal text-ink-500">per job</span></div>
              <button onClick={() => setBlue(b => ({ ...b, services: [...b.services, { id: newId('svc'), name: 'New service', payee: '', mode: 'fixed', value: 0 }] }))}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs text-brand-400 hover:bg-brand-50"><Plus size={11} /> Add</button>
            </div>
            {blue.services.map(s => (
              <div key={s.id} className="group flex items-center gap-2 py-1">
                <div className="min-w-0 flex-1">
                  <input value={s.name} onChange={e => setSvc(s.id, { name: e.target.value })}
                    className="h-7 w-full rounded-md border border-transparent px-1.5 text-[13px] hover:border-line focus:border-brand-300 focus:outline-none" />
                  <div className="flex flex-wrap items-center gap-1 pl-1.5"><Src refs={BLUE_REFS[s.id]} /><Q ids={svcQ[s.id]} /></div>
                </div>
                <select value={s.mode} onChange={e => setSvc(s.id, { mode: e.target.value as any, value: e.target.value === 'pctTM' ? 0.01 : 0 })}
                  className="h-7 rounded-md border border-line bg-white px-1 text-2xs text-ink-700">
                  <option value="fixed">Fixed $</option>
                  <option value="pctTM">% of TM</option>
                </select>
                <NumInput value={s.value} percent={s.mode === 'pctTM'} onChange={v => setSvc(s.id, { value: v })} width={s.mode === 'pctTM' ? 'w-16' : 'w-28'} />
                <button onClick={() => setBlue(b => ({ ...b, services: b.services.filter(x => x.id !== s.id) }))}
                  className="text-ink-300 opacity-0 hover:text-danger-500 group-hover:opacity-100"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <In label="Sales tax" hint="Entered as dollars." refs={BLUE_REFS.salesTax}>
            <NumInput value={blue.salesTax} onChange={v => set({ salesTax: v })} width="w-36" />
          </In>
          <In label="Tariff" hint="% of TM" refs={BLUE_REFS.tariffPct}>
            <NumInput percent value={blue.tariffPct} onChange={v => set({ tariffPct: v })} width="w-20" />
          </In>
          <In label="Frame return credit" hint="Entered per job, never automatic. Adds to TinyMod's net, not the price." refs={BLUE_REFS.frameCredit} qs={['Q15']}>
            <NumInput value={blue.frameCredit} onChange={v => set({ frameCredit: v })} width="w-36" />
          </In>
          <In label="GC fee for this job" hint={`Set here, charged on the budget's site work (${money(gcBase(project, 'approved'), 0)} → ${money(project.gcRate * gcBase(project, 'approved'))}).`} refs={[{ s: 'PM', c: 'E18' }]} qs={['Q3']}>
            <NumInput percent value={project.gcRate} onChange={v => setProject(p => ({ ...p, gcRate: v }))} width="w-20" />
          </In>
        </div>

        {/* How the estimate splits */}
        <div className="px-4 py-3">
          <div className="mb-1 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-500">How the estimate splits <Q ids={['Q1', 'Q17']} /></div>
          <div className="flex items-baseline gap-2 border-b border-line py-1.5">
            <span className="text-[13px] font-semibold text-ink-950">Estimate total (final)</span><Src refs={{ s: 'OF7', c: 'AB77' }} />
            <span className="ml-auto text-[16px] font-semibold tnum text-ink-950">{money(orderForm)}</span>
          </div>
          {rows.map(x => (
            <div key={x.label} className="flex items-baseline gap-2 py-1">
              <span className="text-[13px] text-ink-700">− {x.label}</span>
              {x.payee && <span className="text-2xs text-ink-400">{x.payee}</span>}
              <Src refs={x.refs} /><Q ids={x.q} />
              <span className="ml-auto text-[13px] tnum text-ink-900">{money(x.v)}</span>
            </div>
          ))}
          <div className="mt-1 flex items-baseline gap-2 border-t border-line pt-2">
            <span className="text-[13px] font-semibold text-ink-950">TinyMod margin (what's left)</span>
            <span className="text-2xs text-ink-500">{pct(split.pctOfSubtotal, 2)} of subtotal · {pct(split.pctOfFactory, 2)} of factory</span><Q ids="Q13" />
            <span className={cn('ml-auto text-[16px] font-semibold tnum', split.margin < 0 ? 'text-danger-600' : 'text-ink-950')}>{money(split.margin)}</span>
          </div>
          <div className="flex items-baseline gap-2 py-1">
            <span className="text-[13px] text-ink-700">+ Frame return credit</span>
            <span className="ml-auto text-[13px] tnum text-ink-900">{money(blue.frameCredit)}</span>
          </div>
          <div className="flex items-baseline gap-2 border-t border-line pt-2">
            <span className="text-[13px] font-semibold text-brand-500">TinyMod net</span><Src refs={BLUE_REFS.net} />
            <span className="ml-auto text-[17px] font-semibold tnum text-brand-400">{money(split.net)}</span>
          </div>

          <div className="mt-4 rounded-lg border border-line bg-ink-50/60 p-3">
            <div className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Adjust the price</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-700">
              Try a margin of
              <NumInput percent value={shownPct} onChange={v => setTryPct(v)} width="w-20" className="rounded-md bg-white" />
              of the subtotal
              <Src refs={BLUE_REFS.marginPct} />
            </div>
            {adjusting ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                <span className="text-ink-700">The estimate would be <b className="tnum text-ink-950">{money(whatIf.retail)}</b></span>
                <span className={cn('rounded px-1.5 py-0.5 text-2xs font-semibold tnum', whatIf.retail > orderForm ? 'bg-warn-50 text-warn-700' : 'bg-ok-50 text-ok-700')}>
                  {whatIf.retail > orderForm ? '+' : ''}{money(whatIf.retail - orderForm)} on the base price
                </span>
                <button onClick={() => { setTryPct(null); toast('Back to the estimate\'s price.') }}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-brand-400 hover:bg-brand-50"><RotateCcw size={11} /> Back to the estimate</button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1 text-2xs text-ink-500">
                That's the estimate's price today. Type another % to see the price it gives <ArrowRight size={11} /> then change the base price on the estimate.
                <span className="ml-1">The sheet had 15.3%, which gives $175,091.76</span> <Src refs={{ s: 'BLUE', c: 'L46 / K48' }} />
              </div>
            )}
          </div>
          <div className="mt-2 text-2xs text-ink-500">On signing, this split copies into the budget's hidden 9000 block. It isn't a cost, and it isn't added to the contract.</div>
        </div>
      </div>
    </div>
  )
}

const In = ({ label, hint, refs, qs, children }: any) => (
  <div className="flex items-center gap-3 px-4 py-2.5">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-ink-900">{label}<Q ids={qs} /></div>
      <div className="flex flex-wrap items-center gap-1 text-2xs text-ink-500">{hint}<Src refs={refs} /></div>
    </div>
    {children}
  </div>
)
