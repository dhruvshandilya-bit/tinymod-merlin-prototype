import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FileSpreadsheet, Mic, Server, Lightbulb, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { SOURCES, type SourceKey } from '../data/sources'
import { QUESTIONS } from '../data/questions'
import { cn } from '../lib/util'
import { Q } from './refs'
import PM from '../data/sheets/PM.json'
import DRAW from '../data/sheets/DRAW.json'
import BLUE from '../data/sheets/BLUE.json'
import BLUEM from '../data/sheets/BLUEM.json'
import OF7 from '../data/sheets/OF7.json'
import TPL from '../data/sheets/TPL.json'

interface Sheet { key: string; tab: string; rows: number; cols: number; cells: Record<string, { v?: any; f?: string }> }
export const SHEETS: Partial<Record<SourceKey, Sheet>> = { OF7, BLUE, BLUEM, PM, DRAW, TPL } as any
export const SHEET_ORDER: SourceKey[] = ['OF7', 'BLUE', 'BLUEM', 'PM', 'DRAW', 'TPL']

const colName = (n: number) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) } return s }
const colNum = (s: string) => s.split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0)

/** "E18 & F18", "B9:B11", "C8, C10", "col E" → cells to highlight. Falls back to matching cell text (template refs like "GC_FEE", "2000"). */
function targets(sheet: Sheet, ref?: string): Set<string> {
  const out = new Set<string>()
  if (!ref) return out
  const col = ref.match(/col ([A-Z]{1,3})/)
  if (col) for (let r = 1; r <= sheet.rows; r++) if (sheet.cells[`${col[1]}${r}`]) out.add(`${col[1]}${r}`)
  for (const m of ref.matchAll(/\b([A-Z]{1,3})(\d{1,4})(?::([A-Z]{1,3})(\d{1,4}))?\b/g)) {
    const c1 = colNum(m[1]), r1 = +m[2], c2 = m[3] ? colNum(m[3]) : c1, r2 = m[4] ? +m[4] : r1
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) out.add(`${colName(c)}${r}`)
  }
  if (out.size === 0) {
    const tokens = ref.match(/[A-Z][A-Z_]{2,}|\b\d{4}\b/g) ?? []
    for (const [k, cell] of Object.entries(sheet.cells)) if (tokens.some(t => String(cell.v) === t)) {
      const row = k.replace(/^[A-Z]+/, '')
      for (let c = 1; c <= sheet.cols; c++) out.add(`${colName(c)}${row}`)
    }
  }
  return out
}

const show = (v: any) =>
  v === null || v === undefined ? '' : typeof v === 'number'
    ? (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { maximumFractionDigits: 4 }))
    : String(v)

export function SheetViewer() {
  const { viewer, setViewer, openSource } = useStore()
  if (!viewer) return null
  const sheet = SHEETS[viewer.key]
  const src = SOURCES[viewer.key]
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/30 p-4" onClick={() => setViewer(null)}>
      <div className="flex h-[86vh] w-[1180px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-line px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-ink-950">{src.title}</div>
            <div className="text-2xs text-ink-500">{src.file}{src.tab ? ` · tab "${src.tab}"` : ''}</div>
          </div>
          <button onClick={() => setViewer(null)} className="grid h-8 w-8 place-items-center rounded-md text-ink-500 hover:bg-ink-100"><X size={16} /></button>
        </div>
        <div className="flex flex-wrap gap-1 border-b border-line bg-ink-50/60 px-4 py-1.5">
          {SHEET_ORDER.map(k => (
            <button key={k} onClick={() => openSource(k)}
              className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-2xs', viewer.key === k ? 'bg-white font-semibold text-ink-950 shadow-sm ring-1 ring-line' : 'text-ink-600 hover:bg-white')}>
              {k === 'TPL' ? <Server size={11} /> : <FileSpreadsheet size={11} />}{SOURCES[k].short}
            </button>
          ))}
        </div>
        {sheet ? <Grid sheet={sheet} cell={viewer.cell} note={viewer.note} sourceKey={viewer.key} /> : <Info k={viewer.key} cell={viewer.cell} note={viewer.note} />}
      </div>
    </div>
  )
}

function Grid({ sheet, cell, note, sourceKey }: { sheet: Sheet; cell?: string; note?: string; sourceKey: SourceKey }) {
  const hits = useMemo(() => targets(sheet, cell), [sheet, cell])
  const first = useMemo(() => [...hits].sort((a, b) => +a.replace(/^[A-Z]+/, '') - +b.replace(/^[A-Z]+/, ''))[0], [hits])
  const [sel, setSel] = useState<string | undefined>(first)
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setSel(first)
    const el = first ? scroller.current?.querySelector(`[data-ref="${first}"]`) as HTMLElement | null : null
    if (el) el.scrollIntoView({ block: 'center', inline: 'center' })
    else scroller.current?.scrollTo({ top: 0, left: 0 })
  }, [sheet.key, first])
  const selected = sel ? sheet.cells[sel] : undefined
  const qs = QUESTIONS.filter(q => q.refs.some(r => r.s === sourceKey)).map(q => q.id)
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 text-[12.5px]">
        <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-2xs font-semibold text-ink-700">{sel ?? '—'}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-ink-800">
          {selected?.f ? <><span className="text-brand-500">{selected.f}</span><span className="text-ink-400"> = </span>{show(selected.v)}</> : show(selected?.v)}
        </span>
        {cell && <span className="text-2xs text-ink-500">Highlighted: <b className="text-ink-800">{cell}</b>{note ? ` · ${note}` : ''}</span>}
      </div>
      <div ref={scroller} className="flex-1 overflow-auto">
        <table className="border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 h-6 w-10 border border-line bg-ink-100" />
              {Array.from({ length: sheet.cols }, (_, i) => (
                <th key={i} className="sticky top-0 z-10 h-6 min-w-[72px] border border-line bg-ink-100 px-1 text-center text-[10px] font-semibold text-ink-500">{colName(i + 1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: sheet.rows }, (_, ri) => {
              const r = ri + 1
              return (
                <tr key={r}>
                  <td className="sticky left-0 z-10 h-6 border border-line bg-ink-100 px-1 text-center text-[10px] font-semibold text-ink-500">{r}</td>
                  {Array.from({ length: sheet.cols }, (_, ci) => {
                    const ref = `${colName(ci + 1)}${r}`
                    const c = sheet.cells[ref]
                    const hit = hits.has(ref)
                    const isNum = typeof c?.v === 'number'
                    return (
                      <td key={ref} data-ref={ref} onClick={() => setSel(ref)} title={c?.f ? `${c.f}` : c?.v !== undefined ? String(c.v) : ''}
                        className={cn('h-6 max-w-[260px] cursor-cell truncate border border-line px-1.5',
                          isNum && 'text-right tnum', c?.f && 'text-brand-600',
                          hit && 'bg-warn-50 font-semibold text-ink-950 outline outline-2 -outline-offset-2 outline-warn-500',
                          sel === ref && 'outline outline-2 -outline-offset-2 outline-brand-400')}>
                        {show(c?.v)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2 text-2xs text-ink-500">
        Purple = formula (click a cell to see it). Personal details are redacted.
        {qs.length > 0 && <span className="ml-auto inline-flex items-center gap-1">Questions that use this file <Q ids={qs} /></span>}
      </div>
    </>
  )
}

function Info({ k, cell, note }: { k: SourceKey; cell?: string; note?: string }) {
  const s = SOURCES[k]
  const Icon = s.tone === 'call' ? Mic : s.tone === 'assumed' ? Lightbulb : Server
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl rounded-xl border border-line p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink-950"><Icon size={16} className="text-ink-500" />{s.title}{cell ? <span className="font-normal text-ink-500"> · {cell}</span> : null}</div>
        {note && <blockquote className="mt-3 border-l-4 border-brand-200 pl-3 text-[13.5px] italic text-ink-800">{note}</blockquote>}
        <div className="mt-3 text-[13px] leading-relaxed text-ink-700">{s.what}</div>
        <div className="mt-3 text-2xs text-ink-500">
          {s.tone === 'call' && 'Call transcripts are kept off the public site; this shows the part the prototype relies on.'}
          {s.tone === 'merlin' && 'Merlin\'s code is private; this names the file or setting the prototype relies on.'}
          {s.tone === 'assumed' && 'An assumption has no file behind it. The related open question says what would settle it.'}
        </div>
      </div>
    </div>
  )
}
