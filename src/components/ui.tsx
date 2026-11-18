import React from 'react'
import { cn } from '../lib/util'

export const Card = ({ className, children }: any) => (
  <div className={cn('rounded-xl border border-line bg-white', className)}>{children}</div>
)

export const CardHead = ({ title, sub, right }: any) => (
  <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
    <div>
      <div className="text-[13px] font-semibold text-ink-950">{title}</div>
      {sub && <div className="mt-0.5 text-2xs text-ink-500">{sub}</div>}
    </div>
    {right}
  </div>
)

const TONE: Record<string, string> = {
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  brand: 'bg-brand-50 text-brand-400 ring-brand-200',
  ok: 'bg-ok-50 text-ok-700 ring-ok-500/30',
  warn: 'bg-warn-50 text-warn-700 ring-warn-500/30',
  danger: 'bg-danger-50 text-danger-700 ring-danger-500/30',
  info: 'bg-info-50 text-info-600 ring-info-500/30',
}
export const Badge = ({ tone = 'neutral', className, children }: any) => (
  <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-medium ring-1 ring-inset', TONE[tone], className)}>
    {children}
  </span>
)

export const Button = ({ variant = 'default', size = 'md', className, children, ...p }: any) => (
  <button
    {...p}
    className={cn(
      'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50',
      size === 'sm' ? 'h-7 px-2 text-2xs' : 'h-8 px-3 text-[13px]',
      variant === 'default' && 'bg-brand-400 text-white hover:bg-brand-500',
      variant === 'outline' && 'border border-line bg-white text-ink-700 hover:bg-ink-50',
      variant === 'ghost' && 'text-ink-600 hover:bg-ink-100',
      className,
    )}
  >
    {children}
  </button>
)

export const Stat = ({ label, value, sub, tone }: any) => (
  <div className="rounded-xl border border-line bg-white px-4 py-3">
    <div className="text-2xs font-medium uppercase tracking-wide text-ink-500">{label}</div>
    <div className={cn('mt-1 text-[22px] font-semibold leading-tight tnum', tone === 'danger' ? 'text-danger-600' : 'text-ink-950')}>{value}</div>
    {sub && <div className="mt-0.5 text-2xs text-ink-500">{sub}</div>}
  </div>
)

export const Th = ({ className, children }: any) => (
  <th className={cn('sticky top-0 z-10 whitespace-nowrap border-b border-line bg-white px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-ink-500', className)}>
    {children}
  </th>
)
export const Td = ({ className, children, ...p }: any) => (
  <td {...p} className={cn('border-b border-line px-3 py-2 align-top text-[13px] text-ink-700', className)}>{children}</td>
)

export const PMChip = ({ code }: { code: string | null }) =>
  code ? (
    <span className="inline-grid h-5 w-5 shrink-0 place-items-center rounded bg-brand-50 text-[9px] font-bold text-brand-400 ring-1 ring-inset ring-brand-200">
      {code}
    </span>
  ) : null

export const Empty = ({ children }: any) => (
  <div className="grid place-items-center rounded-xl border border-dashed border-ink-300 bg-white py-14 text-[13px] text-ink-500">{children}</div>
)

export const SectionLabel = ({ children }: any) => (
  <div className="px-3 pb-1 pt-3 text-2xs font-semibold uppercase tracking-wide text-ink-400">{children}</div>
)

/** Inline number field that looks like a spreadsheet cell; commits on blur / Enter. */
export const NumInput = ({ value, onChange, percent = false, disabled = false, className, width = 'w-28' }: {
  value: number; onChange: (n: number) => void; percent?: boolean; disabled?: boolean; className?: string; width?: string
}) => {
  const shown = percent ? +(value * 100).toFixed(4) : value
  const [draft, setDraft] = React.useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const n = parseFloat(draft.replace(/[$,%\s]/g, ''))
    if (!isNaN(n)) onChange(percent ? n / 100 : n)
    setDraft(null)
  }
  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <input
        disabled={disabled}
        value={draft ?? (percent ? String(shown) : shown.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
        onFocus={e => { setDraft(String(shown)); requestAnimationFrame(() => e.target.select()) }}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setDraft(null) }}
        className={cn('h-7 rounded-md border border-transparent bg-transparent text-right text-[13px] tnum text-ink-900 hover:border-line focus:border-brand-300 focus:bg-white focus:outline-none disabled:text-ink-700 disabled:hover:border-transparent',
          percent ? 'pr-5 pl-1' : 'px-1.5', width)}
      />
      {percent && <span className="pointer-events-none absolute right-1.5 text-2xs text-ink-400">%</span>}
    </span>
  )
}

export const Callout = ({ tone = 'info', icon, children, className }: any) => (
  <div className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] leading-snug',
    tone === 'warn' && 'border-warn-500/30 bg-warn-50 text-warn-700',
    tone === 'danger' && 'border-danger-500/30 bg-danger-50 text-danger-700',
    tone === 'ok' && 'border-ok-500/30 bg-ok-50 text-ok-700',
    tone === 'info' && 'border-info-500/20 bg-info-50 text-info-600',
    tone === 'brand' && 'border-brand-200 bg-brand-50 text-brand-500', className)}>
    {icon && <span className="mt-[1px] shrink-0">{icon}</span>}
    <div className="min-w-0">{children}</div>
  </div>
)

export const Seg = ({ items, value, onChange }: { items: { key: string; label: React.ReactNode }[]; value: string; onChange: (k: string) => void }) => (
  <div className="inline-flex rounded-lg border border-line bg-white p-0.5">
    {items.map(i => (
      <button key={i.key} onClick={() => onChange(i.key)}
        className={cn('rounded-md px-2.5 py-1 text-2xs font-medium transition-colors', value === i.key ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}>
        {i.label}
      </button>
    ))}
  </div>
)
