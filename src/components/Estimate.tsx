import React from 'react'
import { ArrowRight, FileSignature, Home } from 'lucide-react'
import { useStore } from '../lib/store'
import { ORDER_FORM } from '../data/job'
import { money, shortDate } from '../lib/util'
import { Badge, Button, Callout } from './ui'
import { BlueSheetPanel } from './BlueSheet'
import { Q, Src } from './refs'

export function Estimate() {
  const { go } = useStore()
  const of = ORDER_FORM
  const options = of.options.reduce((a, o) => a + o.price, 0)
  const total = of.basePrice + options + of.transport + of.surcharge + of.craneSetFinish
  const groups = [...new Set(of.options.map(o => o.group))]

  return (
    <div className="space-y-4">
      <Callout icon={<FileSignature size={14} />} className="max-w-4xl">
        This is Merlin's estimate page. The order form is the selections plus the totals box. The Blue Sheet lives in the Cover Sheet panel underneath,
        which never prints. When the customer signs, Merlin creates the project and seeds its budget from TinyMod's template.
        <Src refs={[{ s: 'CODE', c: 'BOMSummaryPanel.tsx:1694' }, { s: 'TPL' }]} className="ml-1" />
      </Callout>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-xl border border-line bg-white">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 text-ink-600"><Home size={16} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-950">
                Base model: {of.product} {of.model} <Badge>{of.sqft.toLocaleString()} sq ft</Badge><Badge>{of.bedrooms} bed</Badge>
                <Src refs={[{ s: 'OF7', c: 'E5, AD7, V7, C8' }]} />
              </div>
              <div className="text-2xs text-ink-500">Order form #{of.number}, {shortDate(of.date)}. Standard features are in the base price; only the priced options are listed.</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold tnum text-ink-950">{money(of.basePrice)}</div>
              <Src refs={of.baseRef} />
            </div>
          </div>
          {groups.map(g => (
            <div key={g}>
              <div className="border-b border-line bg-ink-50/60 px-4 py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-500">{g}</div>
              {of.options.filter(o => o.group === g).map(o => (
                <div key={o.label} className="flex items-center gap-3 border-b border-line px-4 py-1.5 text-[13px]">
                  <span className="flex-1 text-ink-800">{o.label}</span>
                  <Src refs={o.ref} />
                  <span className={o.price < 0 ? 'w-24 text-right tnum text-ok-700' : 'w-24 text-right tnum text-ink-900'}>{money(o.price)}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="px-4 py-2 text-2xs text-ink-500">Options are passed through at the factory's price. TinyMod's margin sits in the base price.
            <Src refs={{ s: 'C0730', c: '18:46', note: '"our margin lives in the base price and all the options are the same price we get from the manufacturer"' }} className="ml-1" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-white">
            <div className="border-b border-line px-4 py-3 text-[13px] font-semibold text-ink-950">Totals
              <span className="ml-2 font-normal text-2xs text-ink-500">TinyMod's pricing rows in Merlin</span>
              <Src refs={{ s: 'CODE', c: 'V313_TinyModEstimateViewConfig' }} className="ml-1" />
            </div>
            <div className="px-4 py-2 text-[13px]">
              <Row label="Base price" v={of.basePrice} refs={of.baseRef} />
              <Row label="Options" v={options} refs={of.optionsRef} />
              <Row label="Transportation" v={of.transport} refs={of.rowRefs.transport} />
              <Row label="Surcharge" v={of.surcharge} refs={of.rowRefs.surcharge} />
              <Row label="Crane, set & finish crew" v={of.craneSetFinish} refs={of.rowRefs.craneSetFinish} />
              <div className="mt-1 flex items-baseline gap-2 border-t border-line pt-2">
                <span className="font-semibold text-ink-950">Total</span><Src refs={of.totalRef} /><Q ids="Q1" />
                <span className="ml-auto text-[17px] font-semibold tnum text-ink-950">{money(total)}</span>
              </div>
            </div>
          </div>
          <Callout tone="warn" className="text-[12px]">
            The bank-approved purchase agreement is <b>{money(168992)}</b> <Src refs={{ s: 'DRAW', c: 'C8' }} />, which is {money(total - 168992)} less than this estimate.
            The budget uses the bank's number until <Q ids="Q1" /> is answered.
          </Callout>
          <Button variant="outline" className="w-full" onClick={() => go('budget')}>Signed: open the project budget <ArrowRight size={13} /></Button>
        </div>
      </div>

      <BlueSheetPanel orderForm={total} />
    </div>
  )
}

const Row = ({ label, v, refs }: any) => (
  <div className="flex items-baseline gap-2 py-1">
    <span className="text-ink-700">{label}</span><Src refs={refs} />
    <span className="ml-auto tnum text-ink-900">{money(v)}</span>
  </div>
)
