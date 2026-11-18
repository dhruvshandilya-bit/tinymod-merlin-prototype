import React from 'react'
import { AlertTriangle, CheckCircle2, Download, Lock, Plus, Trash2, Wand2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { calcBlue, serviceAmount, solveMargin, type Service } from '../lib/blue'
import { newId } from '../lib/budget'
import { cn, money, pct } from '../lib/util'
import { Button, NumInput } from './ui'
import { exportBlue } from '../lib/export'
import { BLUE_REFS } from '../data/job'
import { Q, Src } from './refs'

/**
 * The Blue Sheet as a TinyMod section of the estimate's Cover Sheet panel (ESTIMATE_COVER_SHEET_ENABLED in Merlin).
 * Internal by construction: the Cover Sheet never prints.
 */
export function BlueSheetPanel({ orderForm }: { orderForm: number }) {
  const { blue, setBlue, project, toast } = useStore()
  const r = calcBlue(blue)
  const diff = r.retail - orderForm
  const matches = Math.abs(diff) < 0.5
  const set = (patch: Partial<typeof blue>) => setBlue(b => ({ ...b, ...patch }))
  const setSvc = (id: string, patch: Partial<Service>) => setBlue(b => ({ ...b, services: b.services.map(s => (s.id === id ? { ...s, ...patch } : s)) }))
  const svcQ: Record<string, string[]> = { viz: ['Q11'], mbi: ['Q11'], merlin: ['Q12', 'Q18'] }

  return (
    <div className="rounded-xl border border-brand-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-200 bg-brand-50/50 px-4 py-3">
        <Lock size={14} className="text-brand-400" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink-950">Cover Sheet · Blue Sheet <span className="font-normal text-ink-500">(TinyMod only, never printed)</span></div>
          <div className="text-2xs text-ink-500">
            Filled in when the factory quote comes back, before the customer signs. It keeps only the house side, as agreed on the 30 Jul call.
            <Src refs={[{ s: 'C0730', c: '43:59' }, { s: 'CODE', c: 'CoverSheetPanel.tsx' }]} className="ml-1" />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportBlue(blue, project.customer, orderForm)}><Download size={12} /> Export</Button>
      </div>

      <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-line">
        <div className="divide-y divide-line">
          <In label="TinyMod wholesale (TM)" hint="From the factory quote." refs={BLUE_REFS.wholesale}>
            <NumInput value={blue.wholesale} onChange={v => set({ wholesale: v })} width="w-36" />
          </In>
          <In label="Uni-Frame" hint="One line under the house, if used." refs={BLUE_REFS.uniFrame}>
            <NumInput value={blue.uniFrame} onChange={v => set({ uniFrame: v })} width="w-36" />
          </In>
          <div className="px-4 py-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-[13px] font-medium text-ink-900">Additional project services</div>
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
                <span className="w-20 text-right text-2xs tnum text-ink-500">{s.mode === 'pctTM' ? money(serviceAmount(blue, s)) : ''}</span>
                <button onClick={() => setBlue(b => ({ ...b, services: b.services.filter(x => x.id !== s.id) }))}
                  className="text-ink-300 opacity-0 hover:text-danger-500 group-hover:opacity-100"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <In label="Sales tax" hint="Entered as dollars." refs={BLUE_REFS.salesTax}>
            <NumInput value={blue.salesTax} onChange={v => set({ salesTax: v })} width="w-36" />
          </In>
          <In label="Tariff" hint="% of TM only" refs={BLUE_REFS.tariffPct}>
            <NumInput percent value={blue.tariffPct} onChange={v => set({ tariffPct: v })} width="w-20" />
          </In>
          <In label="TinyMod margin" hint="% of the subtotal (includes services and sales tax)" refs={BLUE_REFS.marginPct} qs={['Q13']}>
            <NumInput percent value={blue.marginPct} onChange={v => set({ marginPct: v })} width="w-20" />
          </In>
          <In label="One-off project" hint="% of the margin" refs={BLUE_REFS.oneOffPct} qs={['Q14']}>
            <NumInput percent value={blue.oneOffPct} onChange={v => set({ oneOffPct: v })} width="w-20" />
          </In>
          <In label="Frame return credit" hint="Goes to TinyMod's net, not to retail" refs={BLUE_REFS.frameCredit} qs={['Q15']}>
            <NumInput value={blue.frameCredit} onChange={v => set({ frameCredit: v })} width="w-36" />
          </In>
        </div>

        <div className="px-4 py-3">
          <div className="mb-1 text-2xs font-semibold uppercase tracking-wide text-ink-500">Project totals (the master's formulas)</div>
          <Out label="Modular totals" f="TM + Uni-Frame" v={r.modular} refs={BLUE_REFS.modular} />
          <Out label="Project services" v={r.services} refs={BLUE_REFS.services} />
          <Out label="Sales tax" v={blue.salesTax} refs={BLUE_REFS.salesTax} />
          <Out label="Subtotal" f="tax + modular + services" v={r.subtotal} strong refs={BLUE_REFS.subtotal} />
          <Out label="Tariff" f={`${pct(blue.tariffPct)} × TM`} v={r.tariff} refs={BLUE_REFS.tariff} />
          <Out label="TinyMod margin" f={`${pct(blue.marginPct, 2)} × subtotal`} v={r.margin} refs={BLUE_REFS.margin} />
          <Out label="One-off project" f={`${pct(blue.oneOffPct)} × margin`} v={r.oneOff} refs={BLUE_REFS.oneOff} />
          <Out label="Retail sales grand total" v={r.retail} strong big refs={BLUE_REFS.retail} />
          <div className="my-2 border-t border-dashed border-line" />
          <Out label="TinyMod net" f="margin + one-off + frame credit" v={r.net} strong big tone="brand" refs={BLUE_REFS.net} />

          <div className={cn('mt-3 rounded-lg border p-3', matches ? 'border-ok-500/40 bg-ok-50/40' : 'border-warn-500/50 bg-warn-50/40')}>
            <div className="flex items-start gap-2">
              {matches ? <CheckCircle2 size={15} className="mt-0.5 text-ok-600" /> : <AlertTriangle size={15} className="mt-0.5 text-warn-600" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-ink-950">
                  {matches ? 'Retail matches the estimate total' : 'Retail does not match the estimate total'} <Q ids="Q1" />
                </div>
                <div className="mt-1 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-[12.5px] tnum text-ink-700">
                  <span>Estimate total (order form)</span><span className="text-right">{money(orderForm)}</span>
                  <span>Blue Sheet retail</span><span className="text-right">{money(r.retail)}</span>
                  <span className="font-medium">Difference</span><span className={cn('text-right font-medium', !matches && 'text-warn-700')}>{money(diff)}</span>
                </div>
                {!matches && (
                  <Button size="sm" className="mt-2" onClick={() => { const m = solveMargin(blue, orderForm); set({ marginPct: m }); toast(`Margin set to ${pct(m, 2)} so retail equals the estimate.`) }}>
                    <Wand2 size={12} /> Set margin to match ({pct(solveMargin(blue, orderForm), 2)})
                  </Button>
                )}
                <div className="mt-1.5 text-2xs text-ink-500">Today they change the margin by hand until the two agree. On signing, these numbers copy into the budget's hidden 9000 block.</div>
              </div>
            </div>
          </div>
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

const Out = ({ label, f, v, strong, big, tone, refs }: any) => (
  <div className="flex items-baseline gap-2 py-1">
    <div className={cn('text-[13px]', strong ? 'font-semibold text-ink-950' : 'text-ink-700')}>{label}</div>
    {f && <div className="hidden truncate text-2xs text-ink-400 xl:block">= {f}</div>}
    <Src refs={refs} />
    <div className={cn('ml-auto tnum', big ? 'text-[16px]' : 'text-[13px]', strong && 'font-semibold', tone === 'brand' ? 'text-brand-400' : 'text-ink-950')}>{money(v)}</div>
  </div>
)
