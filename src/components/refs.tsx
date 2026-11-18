import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpen, FileSpreadsheet, HelpCircle, Mic, Server, X, Lightbulb } from 'lucide-react'
import { useStore } from '../lib/store'
import { SOURCES, type Ref, type SourceKey } from '../data/sources'
import { QUESTIONS, type Audience } from '../data/questions'
import { cn } from '../lib/util'

const TONE: Record<string, string> = {
  sheet: 'bg-ok-50 text-ok-700 ring-ok-500/25',
  merlin: 'bg-brand-50 text-brand-500 ring-brand-200',
  call: 'bg-info-50 text-info-600 ring-info-500/25',
  assumed: 'bg-warn-50 text-warn-700 ring-warn-500/30',
}
const ICON: Record<string, any> = { sheet: FileSpreadsheet, merlin: Server, call: Mic, assumed: Lightbulb }

/** "PM sheet E33" chips. Hover for the file, tab, cell and note. Hidden when sources are switched off. */
export function Src({ refs, className }: { refs?: Ref[] | Ref; className?: string }) {
  const { showSources } = useStore()
  const list = !refs ? [] : Array.isArray(refs) ? refs : [refs]
  if (!showSources || list.length === 0) return null
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1 align-middle', className)}>
      {list.map((ref, i) => <Chip key={i} r={ref} />)}
    </span>
  )
}

function Chip({ r }: { r: Ref }) {
  const s = SOURCES[r.s]
  const Icon = ICON[s.tone]
  const [open, setOpen] = useState(false)
  return (
    <span className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className={cn('inline-flex cursor-help items-center gap-0.5 whitespace-nowrap rounded px-1 py-[1px] text-[10px] font-medium leading-none ring-1 ring-inset', TONE[s.tone])}>
        <Icon size={9} />{s.short}{r.c ? ` ${r.c}` : ''}
      </span>
      {open && (
        <span className="absolute left-0 top-full z-40 mt-1 block w-72 rounded-lg border border-line bg-white p-2.5 text-left text-[11.5px] font-normal normal-case leading-snug tracking-normal text-ink-700 shadow-lg">
          <span className="block font-semibold text-ink-950">{s.title}</span>
          <span className="mt-0.5 block text-ink-500">{s.file}{s.tab ? ` · tab "${s.tab}"` : ''}{r.c ? ` · ${r.c}` : ''}</span>
          {r.note && <span className="mt-1 block text-ink-800">{r.note}</span>}
        </span>
      )}
    </span>
  )
}

/** "Q3" marker. Opens the question in the drawer. */
export function Q({ ids, className }: { ids?: string[] | string; className?: string }) {
  const { openQuestion } = useStore()
  const list = !ids ? [] : Array.isArray(ids) ? ids : [ids]
  if (!list.length) return null
  return (
    <span className={cn('inline-flex items-center gap-1 align-middle', className)}>
      {list.map(id => (
        <button key={id} onClick={e => { e.stopPropagation(); openQuestion(id) }}
          title={QUESTIONS.find(q => q.id === id)?.title}
          className="inline-flex items-center gap-0.5 rounded-full bg-danger-50 px-1.5 py-[1px] text-[10px] font-semibold leading-none text-danger-600 ring-1 ring-inset ring-danger-500/30 hover:bg-danger-500 hover:text-white">
          <HelpCircle size={9} />{id}
        </button>
      ))}
    </span>
  )
}

const SCREEN_LABEL = { estimate: 'Estimate · Cover Sheet', budget: 'Project · Budget', draws: 'Project · Budget · Draws', schedule: 'Project · Schedule' }

export function Drawers() {
  const { drawer, setDrawer } = useStore()
  if (!drawer) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/20" onClick={() => setDrawer(null)}>
      <div className="flex h-full w-[520px] max-w-full flex-col bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {drawer === 'questions' ? <QuestionsPanel /> : <SourcesPanel />}
      </div>
    </div>
  )
}

function QuestionsPanel() {
  const { setDrawer, focusQ, go } = useStore()
  const [who, setWho] = useState<'all' | Audience>('all')
  const focusRef = useRef<HTMLDivElement>(null)
  useEffect(() => { focusRef.current?.scrollIntoView({ block: 'start' }) }, [focusQ])
  const list = QUESTIONS.filter(q => who === 'all' || q.audience === who)
  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <HelpCircle size={16} className="text-danger-500" />
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-ink-950">Open questions ({QUESTIONS.length})</div>
          <div className="text-2xs text-ink-500">What each one decides, why it matters, and what the prototype assumes until it's answered.</div>
        </div>
        <button onClick={() => setDrawer(null)} className="grid h-8 w-8 place-items-center rounded-md text-ink-500 hover:bg-ink-100"><X size={16} /></button>
      </div>
      <div className="flex gap-1 border-b border-line px-4 py-2">
        {(['all', 'TinyMod', 'Merlin team'] as const).map(k => (
          <button key={k} onClick={() => setWho(k)}
            className={cn('rounded-md px-2.5 py-1 text-2xs font-medium', who === k ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}>
            {k === 'all' ? 'All' : `For ${k}`} ({k === 'all' ? QUESTIONS.length : QUESTIONS.filter(q => q.audience === k).length})
          </button>
        ))}
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {list.map(q => (
          <div key={q.id} ref={q.id === focusQ ? focusRef : undefined}
            className={cn('scroll-mt-4 rounded-xl border p-3.5', q.id === focusQ ? 'border-danger-500/50 bg-danger-50/30 ring-2 ring-danger-500/20' : 'border-line')}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 rounded-full bg-danger-50 px-1.5 py-0.5 text-[10px] font-bold text-danger-600 ring-1 ring-inset ring-danger-500/30">{q.id}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-snug text-ink-950">{q.title}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-400">Ask {q.audience} · shows on {SCREEN_LABEL[q.screen]}</div>
              </div>
            </div>
            <div className="mt-2 text-[12.5px] leading-snug text-ink-700"><span className="font-semibold text-ink-900">Why it matters: </span>{q.why}</div>
            <div className="mt-1.5 text-[12.5px] leading-snug text-warn-700"><span className="font-semibold">Prototype assumes: </span>{q.assumes}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <ForceSrc refs={q.refs} />
              <button onClick={() => { go(q.screen); setDrawer(null) }}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-brand-400 hover:bg-brand-50">
                Show me <ArrowRight size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/** Chips inside the drawers always show, even when inline sources are switched off. */
function ForceSrc({ refs }: { refs: Ref[] }) {
  return <span className="inline-flex flex-wrap gap-1">{refs.map((x, i) => <Chip key={i} r={x} />)}</span>
}

function SourcesPanel() {
  const { setDrawer } = useStore()
  const order: SourceKey[] = ['OF7', 'BLUE', 'BLUEM', 'PM', 'DRAW', 'SCHED', 'TPL', 'C0730', 'C1001', 'C1010', 'CODE', 'ASSUMED']
  const used = (k: SourceKey) => QUESTIONS.filter(q => q.refs.some(x => x.s === k)).map(q => q.id)
  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <BookOpen size={16} className="text-ok-600" />
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-ink-950">Where the data came from</div>
          <div className="text-2xs text-ink-500">Every chip on screen points to one of these. Hover a chip for the exact cell.</div>
        </div>
        <button onClick={() => setDrawer(null)} className="grid h-8 w-8 place-items-center rounded-md text-ink-500 hover:bg-ink-100"><X size={16} /></button>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {order.map(k => {
          const s = SOURCES[k]
          const Icon = ICON[s.tone]
          const qs = used(k)
          return (
            <div key={k} className="rounded-xl border border-line p-3.5">
              <div className="flex items-start gap-2">
                <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 ring-inset', TONE[s.tone])}><Icon size={12} /></span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ink-950">{s.title}</div>
                  <div className="text-2xs text-ink-500">{s.file}{s.tab ? ` · tab "${s.tab}"` : ''}</div>
                </div>
              </div>
              <div className="mt-2 text-[12.5px] leading-snug text-ink-700">{s.what}</div>
              {qs.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1 text-2xs text-ink-500">Behind questions <Q ids={qs} /></div>}
            </div>
          )
        })}
      </div>
    </>
  )
}
