import React, { useState } from 'react'
import { ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Hand, Landmark, Lock, MessageCircleQuestion, CalendarRange, FileSpreadsheet, ClipboardList, Megaphone, MapPin, PanelRightClose } from 'lucide-react'
import { useStore } from '../lib/store'
import { WALK, type StepKey } from '../data/walkthrough'
import { QUESTIONS } from '../data/questions'
import { cn } from '../lib/util'
import { Q } from './refs'

export function StepBar() {
  const { nav, go } = useStore()
  const i = WALK.findIndex(s => s.key === nav.step)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {WALK.map((s, k) => (
        <React.Fragment key={s.key}>
          {k > 0 && <ChevronRight size={13} className="text-ink-300" />}
          <button onClick={() => go(s.key)}
            className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] transition-colors',
              nav.step === s.key ? 'bg-ink-950 font-medium text-white' : k < i ? 'text-ink-700 hover:bg-ink-100' : 'text-ink-500 hover:bg-ink-100')}>
            <span className={cn('grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold',
              nav.step === s.key ? 'bg-white text-ink-950' : 'bg-ink-200 text-ink-600')}>{s.n}</span>
            {s.short}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}

export function NotesPanel() {
  const { nav, go, setShowNotes } = useStore()
  const i = WALK.findIndex(s => s.key === nav.step)
  const s = WALK[i]
  const prev = WALK[i - 1]
  const next = WALK[i + 1]
  const qs = s.questions.map(id => QUESTIONS.find(x => x.id === id)!)
  const asks = qs.filter(q => q.status !== 'answered')
  const decided = qs.filter(q => q.status === 'answered')
  return (
    <aside className="sticky top-[49px] hidden h-[calc(100vh-49px)] w-[360px] shrink-0 flex-col border-l border-line bg-white lg:flex">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Megaphone size={15} className="text-brand-400" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-ink-950">Presenter notes</div>
          <div className="text-2xs text-ink-500">Step {s.n} of {WALK.length - 1}: {s.title}</div>
        </div>
        <button onClick={() => setShowNotes(false)} title="Hide notes" className="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-ink-100"><PanelRightClose size={15} /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-[12.5px] leading-snug text-ink-700">
        <Block icon={MapPin} title="Where it lives in Merlin">{s.where}</Block>
        <Block icon={FileSpreadsheet} title="Replaces">{s.replaces}</Block>
        <Block icon={Megaphone} title="Say">
          <ul className="space-y-1.5">{s.say.map((x, k) => <li key={k} className="flex gap-2"><span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-ink-400" />{x}</li>)}</ul>
        </Block>
        <Block icon={Hand} title="Click">
          <ol className="space-y-1.5">{s.click.map((x, k) => <li key={k} className="flex gap-2"><span className="shrink-0 font-semibold text-brand-400">{k + 1}.</span>{x}</li>)}</ol>
        </Block>
        <Block icon={MessageCircleQuestion} title="If they ask">
          <div className="space-y-1">{s.faq.map((f, k) => <Faq key={k} q={f.q} a={f.a} />)}</div>
        </Block>
        {asks.length > 0 && (
          <Block icon={ClipboardList} title="Ask them (still open)">
            <div className="space-y-1.5">
              {asks.map(q => <div key={q.id} className="flex items-start gap-1.5"><Q ids={q.id} /><span>{q.title}{q.status === 'partly' && <span className="text-ink-500"> (part answered)</span>}</span></div>)}
            </div>
          </Block>
        )}
        {decided.length > 0 && (
          <Block icon={CheckCircle2} title="Already decided (tell them)">
            <div className="space-y-1.5">
              {decided.map(q => <div key={q.id} className="flex items-start gap-1.5"><Q ids={q.id} /><span>{q.answer}</span></div>)}
            </div>
          </Block>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        {prev && <button onClick={() => go(prev.key)} className="flex h-8 items-center gap-1 rounded-lg border border-line px-2.5 text-[12.5px] text-ink-700 hover:bg-ink-50"><ChevronLeft size={13} /> {prev.short}</button>}
        {next && <button onClick={() => go(next.key)} className="ml-auto flex h-8 items-center gap-1 rounded-lg bg-brand-400 px-3 text-[12.5px] font-medium text-white hover:bg-brand-500">Next: {next.short} <ChevronRight size={13} /></button>}
      </div>
    </aside>
  )
}

const Block = ({ icon: Icon, title, children }: any) => (
  <section>
    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500"><Icon size={11} />{title}</div>
    <div>{children}</div>
  </section>
)

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-line">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left font-medium text-ink-900 hover:bg-ink-50">
        <span className="flex-1">{q}</span><ChevronDown size={13} className={cn('mt-0.5 shrink-0 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-line px-2.5 py-1.5 text-ink-700">{a}</div>}
    </div>
  )
}

/** Step 0: the whole picture on one screen. */
export function Overview() {
  const { go } = useStore()
  const cards: { step: StepKey; icon: any; title: string; sheet: string; place: string; badge: string; tone: string; who: string }[] = [
    { step: 'estimate', icon: Lock, title: 'Estimate & Blue Sheet', sheet: 'Order Form + Blue Sheet', place: 'Sales → Estimate, Cover Sheet panel', badge: 'Exists · Blue Sheet section new', tone: 'bg-info-50 text-info-600', who: 'Blue Sheet: TinyMod only' },
    { step: 'budget', icon: FileSpreadsheet, title: 'Budget', sheet: 'PM & Cost Model', place: 'Project → Budget tab', badge: 'Exists · GC fee editor new', tone: 'bg-info-50 text-info-600', who: 'Customer & bank' },
    { step: 'draws', icon: Landmark, title: 'Draws', sheet: 'Draw & Budget Master', place: 'Project → Budget → Draws tab', badge: 'New screen', tone: 'bg-brand-400 text-white', who: 'Customer & bank' },
    { step: 'schedule', icon: CalendarRange, title: 'Schedule', sheet: 'Project template', place: 'Project → Schedule tab', badge: 'Exists · 6 suggested steps', tone: 'bg-info-50 text-info-600', who: 'Everyone on the job' },
  ]
  const between = ['Customer signs', 'Bank approves the loan', '']
  return (
    <div className="space-y-5">
      <div className="max-w-3xl">
        <h2 className="text-[20px] font-semibold text-ink-950">One job, one budget</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-600">
          Today a TinyMod job lives in four spreadsheets that share the same list of lines but are typed in separately.
          In Merlin it's one estimate and one budget, shown in the screens Merlin already has. Only the <b>Draws</b> tab is new.
        </p>
      </div>

      <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {cards.slice(0, 3).map((c, k) => (
          <React.Fragment key={c.step}>
            <Card c={c} onOpen={() => go(c.step)} n={k + 1} />
            {k < 2 && (
              <div className="flex items-center justify-center gap-1 text-2xs font-medium text-ink-500 lg:flex-col">
                <ArrowRight size={16} className="text-ink-300" />
                <span className="whitespace-nowrap">{between[k]}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_2fr]">
        <Card c={cards[3]} onOpen={() => go('schedule')} n={4} />
        <div className="rounded-xl border border-dashed border-line bg-white p-4 text-[13px] leading-relaxed text-ink-600">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">How they connect</div>
          <ul className="space-y-1">
            <li><b>The same list of lines</b> runs through the budget, the draws and the schedule, as Eric said on 1 Oct.</li>
            <li><b>Signing the estimate</b> creates the budget from your template and copies the Blue Sheet into a hidden block.</li>
            <li><b>A draw is released by hand.</b> Merlin tells you when the step it waits on is done.</li>
            <li><b>Funding a draw</b> raises the invoice to the bank and updates the budget's Drawn column.</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-[12.5px] text-ink-600">
        <span><b className="text-ink-900">Tip:</b> "Show sources" puts the sheet and cell on every number; tap a chip to open that sheet at the cell. "Open questions" lists what we still need and what's already decided.</span>
        <button onClick={() => go('estimate')} className="ml-auto flex h-8 items-center gap-1 rounded-lg bg-brand-400 px-3 font-medium text-white hover:bg-brand-500">Start: Estimate <ChevronRight size={13} /></button>
      </div>
    </div>
  )
}

const Card = ({ c, onOpen, n }: any) => (
  <button onClick={onOpen} className="group flex flex-col rounded-xl border border-line bg-white p-4 text-left transition-shadow hover:shadow-md">
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-600">{n}</span>
      <c.icon size={15} className="text-ink-500" />
      <span className="text-[14px] font-semibold text-ink-950">{c.title}</span>
    </div>
    <div className="mt-3 text-2xs uppercase tracking-wide text-ink-400">Replaces</div>
    <div className="text-[13px] text-ink-800">{c.sheet}</div>
    <div className="mt-2 text-2xs uppercase tracking-wide text-ink-400">In Merlin</div>
    <div className="text-[13px] text-ink-800">{c.place}</div>
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className={cn('rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold', c.tone)}>{c.badge}</span>
      <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10.5px] text-ink-600">{c.who}</span>
    </div>
    <span className="mt-auto pt-3 text-2xs font-medium text-brand-400 opacity-0 group-hover:opacity-100">Open →</span>
  </button>
)
