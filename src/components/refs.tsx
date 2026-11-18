import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, FileSpreadsheet, HelpCircle, Mic, Server, X, Lightbulb } from 'lucide-react'
import { useStore } from '../lib/store'
import { SOURCES, type Ref, type SourceKey } from '../data/sources'
import { QUESTIONS } from '../data/questions'
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
  const { openSource, go, setDrawer } = useStore()
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(false)
    if (r.s === 'SCHED') { setDrawer(null); go('schedule') } else openSource(r.s, r.c, r.note)
  }
  return (
    <span className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button onClick={onClick} className={cn('inline-flex cursor-pointer items-center gap-0.5 whitespace-nowrap rounded px-1 py-[1px] text-[10px] font-medium leading-none ring-1 ring-inset hover:brightness-95', TONE[s.tone])}>
        <Icon size={9} />{s.short}{r.c ? ` ${r.c}` : ''}
      </button>
      {open && (
        <span className="absolute left-0 top-full z-40 mt-1 block w-72 rounded-lg border border-line bg-white p-2.5 text-left text-[11.5px] font-normal normal-case leading-snug tracking-normal text-ink-700 shadow-lg">
          <span className="block font-semibold text-ink-950">{s.title}</span>
          <span className="mt-0.5 block text-ink-500">{s.file}{s.tab ? ` · tab "${s.tab}"` : ''}{r.c ? ` · ${r.c}` : ''}</span>
          {r.note && <span className="mt-1 block text-ink-800">{r.note}</span>}
          <span className="mt-1.5 block text-[10.5px] font-medium text-brand-400">Click to open{r.c ? ` at ${r.c}` : ''}</span>
        </span>
      )}
    </span>
  )
}

/** "Q3" marker. Red = open, amber = partly answered, green = answered. Opens the question in the drawer. */
export function Q({ ids, className }: { ids?: string[] | string; className?: string }) {
  const { openQuestion } = useStore()
  const list = !ids ? [] : Array.isArray(ids) ? ids : [ids]
  if (!list.length) return null
  return (
    <span className={cn('inline-flex items-center gap-1 align-middle', className)}>
      {list.map(id => {
        const q = QUESTIONS.find(x => x.id === id)
        const st = q?.status ?? 'open'
        return (
          <button key={id} onClick={e => { e.stopPropagation(); openQuestion(id) }} title={q ? `${q.title}${q.answer ? ' — ' + q.answer : ''}` : id}
            className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[10px] font-semibold leading-none ring-1 ring-inset',
              st === 'answered' ? 'bg-ok-50 text-ok-700 ring-ok-500/30 hover:bg-ok-500 hover:text-white'
              : st === 'partly' ? 'bg-warn-50 text-warn-700 ring-warn-500/30 hover:bg-warn-500 hover:text-white'
              : 'bg-danger-50 text-danger-600 ring-danger-500/30 hover:bg-danger-500 hover:text-white')}>
            {st === 'answered' ? <CheckCircle2 size={9} /> : <HelpCircle size={9} />}{id}
          </button>
        )
      })}
    </span>
  )
}

const SCREEN_LABEL = { estimate: 'Estimate', budget: 'Budget', draws: 'Draws', schedule: 'Schedule' }

export function Drawers() {
  const { drawer, setDrawer } = useStore()
  if (!drawer) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/20" onClick={() => setDrawer(null)}>
      <div className="flex h-full w-[540px] max-w-full flex-col bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {drawer === 'questions' ? <QuestionsPanel /> : <SourcesPanel />}
      </div>
    </div>
  )
}

function QuestionsPanel() {
  const { setDrawer, focusQ, go } = useStore()
  const focused = QUESTIONS.find(q => q.id === focusQ)
  const [view, setView] = useState<'open' | 'answered' | 'all'>(focused?.status === 'answered' ? 'answered' : 'open')
  const focusRef = useRef<HTMLDivElement>(null)
  useEffect(() => { focusRef.current?.scrollIntoView({ block: 'start' }) }, [focusQ, view])
  const open = QUESTIONS.filter(q => q.status !== 'answered')
  const answered = QUESTIONS.filter(q => q.status === 'answered')
  const list = view === 'open' ? open : view === 'answered' ? answered : QUESTIONS
  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <HelpCircle size={16} className="text-danger-500" />
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-ink-950">Questions: {open.length} open, {answered.length} answered</div>
          <div className="text-2xs text-ink-500">Why each one matters, what the prototype does meanwhile, and the sheet behind it (tap a file chip to open it).</div>
        </div>
        <button onClick={() => setDrawer(null)} className="grid h-8 w-8 place-items-center rounded-md text-ink-500 hover:bg-ink-100"><X size={16} /></button>
      </div>
      <div className="flex gap-1 border-b border-line px-4 py-2">
        {([['open', `Open (${open.length})`], ['answered', `Answered (${answered.length})`], ['all', `All (${QUESTIONS.length})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setView(k)}
            className={cn('rounded-md px-2.5 py-1 text-2xs font-medium', view === k ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}>{label}</button>
        ))}
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {list.map(q => (
          <div key={q.id} ref={q.id === focusQ ? focusRef : undefined}
            className={cn('scroll-mt-4 rounded-xl border p-3.5', q.id === focusQ ? 'border-brand-300 ring-2 ring-brand-200' : 'border-line', q.status === 'answered' && 'bg-ok-50/30')}>
            <div className="flex items-start gap-2">
              <Q ids={q.id} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-snug text-ink-950">{q.title}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-400">
                  {q.status === 'answered' ? `Answered${q.answeredBy === 'Merlin' ? ' (left to Merlin)' : ''}` : q.status === 'partly' ? 'Partly answered' : `Ask ${q.audience}`} · {SCREEN_LABEL[q.screen]}
                </div>
              </div>
            </div>
            {q.answer && (
              <div className={cn('mt-2 rounded-lg px-2.5 py-1.5 text-[12.5px] leading-snug', q.status === 'answered' ? 'bg-ok-50 text-ok-700' : 'bg-warn-50 text-warn-700')}>
                <span className="font-semibold">{q.status === 'answered' ? 'Answer: ' : 'So far: '}</span>{q.answer}
              </div>
            )}
            {q.status !== 'answered' && (
              <>
                <div className="mt-2 text-[12.5px] leading-snug text-ink-700"><span className="font-semibold text-ink-900">Why it matters: </span>{q.why}</div>
                <div className="mt-1.5 text-[12.5px] leading-snug text-warn-700"><span className="font-semibold">Meanwhile the prototype assumes: </span>{q.assumes}</div>
              </>
            )}
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
  const { setDrawer, openSource, go } = useStore()
  const order: SourceKey[] = ['OF7', 'BLUE', 'BLUEM', 'PM', 'DRAW', 'SCHED', 'TPL', 'C0730', 'C1001', 'C1010', 'CODE', 'ASSUMED']
  const used = (k: SourceKey) => QUESTIONS.filter(q => q.refs.some(x => x.s === k)).map(q => q.id)
  const opens = (k: SourceKey) => ['OF7', 'BLUE', 'BLUEM', 'PM', 'DRAW', 'TPL', 'SCHED'].includes(k)
  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <BookOpen size={16} className="text-ok-600" />
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-ink-950">Where the data came from</div>
          <div className="text-2xs text-ink-500">Tap a file to open it (personal details redacted). Tap any chip on screen to open its exact cell.</div>
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
              <button disabled={!opens(k)} onClick={() => (k === 'SCHED' ? (setDrawer(null), go('schedule')) : openSource(k))}
                className={cn('flex w-full items-start gap-2 text-left', opens(k) && 'group')}>
                <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 ring-inset', TONE[s.tone])}><Icon size={12} /></span>
                <div className="min-w-0 flex-1">
                  <div className={cn('text-[13px] font-semibold text-ink-950', opens(k) && 'group-hover:text-brand-500 group-hover:underline')}>{s.title}</div>
                  <div className="text-2xs text-ink-500">{s.file}{s.tab ? ` · tab "${s.tab}"` : ''}</div>
                </div>
                {opens(k) && <span className="shrink-0 rounded-md bg-brand-50 px-2 py-1 text-2xs font-medium text-brand-500">{k === 'SCHED' ? 'Go to screen' : 'Open'}</span>}
              </button>
              <div className="mt-2 text-[12.5px] leading-snug text-ink-700">{s.what}</div>
              {qs.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1 text-2xs text-ink-500">Behind questions <Q ids={qs} /></div>}
            </div>
          )
        })}
      </div>
    </>
  )
}
