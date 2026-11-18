import { cents } from './util'
import type { Ref } from '../data/sources'

/** TinyMod's cost codes, already seeded in their Merlin org (V310), in the order a bank reads them. */
export const COST_CODES: Record<string, string> = {
  '1000': 'Pre-Construction & Design',
  '2000': 'Modular Unit',
  '3000': 'Earthwork & Site Prep',
  '4000': 'Foundation',
  '5000': 'Utilities',
  '6000': 'Delivery, Set & Finish',
  '7000': 'Final Connections & Inspection',
  '8000': 'Project Services & Fees',
}

/**
 * house        — the modular purchase agreement lines (drawn by the house rule or pinned)
 * construction — site work and everything the GC fee is charged on
 * gcfee        — amount = rate × the lines ticked as GC base
 * contingency  — amount = loan − every other approved line (the plug the sheet types by hand)
 * item         — a contingency item: an overrun paid out of contingency
 * outside      — not in the loan (feasibility fee); shown, never drawn
 */
export type LineKind = 'house' | 'construction' | 'gcfee' | 'contingency' | 'item' | 'outside'
export type Stage = 'rough' | 'bid' | 'final'

export type Alloc =
  | { mode: 'pin'; draw: number }        // 100% in one draw
  | { mode: 'track' }                    // the construction % track
  | { mode: 'split'; pct: number[] }     // custom % per draw
  | { mode: 'house' }                    // deposit % in one draw, balance in another
  | { mode: 'none' }

export interface Line {
  id: string
  code: string
  name: string
  kind: LineKind
  /** The working number on the costing sheet: rough budget, then bid, then final. */
  amount: number
  /** What the bank approved ("Lender Amt"). Draws split this, not the working number. */
  approved: number
  stage: Stage
  paid: number
  contractor?: string
  note?: string
  gcBase: boolean
  stepId?: string
  alloc: Alloc
  /** For contingency items: the line whose overrun this covers. */
  coversId?: string
  /** Prototype annotations: where the number came from, where its draw placement came from, open questions. */
  refs?: Ref[]
  allocRef?: Ref
  qs?: string[]
}

export type DrawStatus = 'planned' | 'requested' | 'funded'
export interface Draw {
  id: string
  name: string
  /** Bank's share of the loan for this draw (the 25 / 65 / 10 row). A warning, not a block. */
  capPct: number
  status: DrawStatus
  date?: string
  stepId?: string
  refs?: Ref[]
}

export interface Project {
  customer: string
  bank: string
  loan: number
  gcRate: number
  draws: Draw[]
  house: { depositPct: number; depositDraw: number; balanceDraw: number }
  /** Construction track: % of each line per draw. */
  track: number[]
  lines: Line[]
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export const inLoan = (l: Line) => l.kind !== 'outside'

export function gcBase(p: Project, field: 'amount' | 'approved') {
  return sum(p.lines.filter(l => l.gcBase && inLoan(l) && l.kind !== 'gcfee').map(l => l[field]))
}

/** Lines with the GC fee and contingency filled in. Everything else reads from this. */
export function resolve(p: Project): Line[] {
  const gcAmount = cents(p.gcRate * gcBase(p, 'amount'))
  const gcApproved = cents(p.gcRate * gcBase(p, 'approved'))
  const withGc = p.lines.map(l => (l.kind === 'gcfee' ? { ...l, amount: gcAmount, approved: gcApproved } : l))
  const others = sum(withGc.filter(l => inLoan(l) && l.kind !== 'contingency').map(l => l.approved))
  const remaining = cents(p.loan - others)
  return withGc.map(l => (l.kind === 'contingency' ? { ...l, amount: remaining, approved: remaining } : l))
}

/** Contingency before any items were paid out of it — what the sheet shows as "Contingency - $x". */
export function contingencyOriginal(p: Project) {
  const lines = resolve(p)
  const items = sum(lines.filter(l => l.kind === 'item').map(l => l.approved))
  const pool = lines.find(l => l.kind === 'contingency')?.approved ?? 0
  return { original: cents(pool + items), used: cents(items), remaining: pool }
}

const clamp = (i: number, n: number) => Math.max(0, Math.min(n - 1, i))

/** Spread `total` by fractions, last non-zero share absorbs the rounding so it always adds back up. */
function spread(total: number, fr: number[]): number[] {
  const out = fr.map(f => cents(total * f))
  const lastIdx = fr.map((f, i) => (f > 0 ? i : -1)).filter(i => i >= 0).pop()
  const fsum = sum(fr)
  if (lastIdx !== undefined && Math.abs(fsum - 1) < 1e-9) out[lastIdx] = cents(out[lastIdx] + total - sum(out))
  return out
}

export function houseDeposit(p: Project) {
  const basis = sum(p.lines.filter(l => l.kind === 'house').map(l => l.approved))
  // The sheet rounds the deposit to whole dollars: 35% × 177,552 = 62,143.20 → 62,143.
  return { basis, deposit: Math.round(p.house.depositPct * basis) }
}

/** line id → amount per draw (approved money only). */
export function allocate(p: Project): Record<string, number[]> {
  const n = p.draws.length
  const out: Record<string, number[]> = {}
  const { deposit } = houseDeposit(p)
  for (const l of resolve(p)) {
    const row = Array(n).fill(0)
    const a = l.alloc
    if (!inLoan(l) || a.mode === 'none') {
      // not drawn
    } else if (a.mode === 'pin') {
      row[clamp(a.draw, n)] = l.approved
    } else if (a.mode === 'track') {
      spread(l.approved, padTo(p.track, n)).forEach((v, i) => (row[i] = v))
    } else if (a.mode === 'split') {
      spread(l.approved, padTo(a.pct, n)).forEach((v, i) => (row[i] = v))
    } else if (a.mode === 'house') {
      const dep = Math.min(deposit, l.approved)
      row[clamp(p.house.depositDraw, n)] += dep
      row[clamp(p.house.balanceDraw, n)] += cents(l.approved - dep)
    }
    out[l.id] = row
  }
  return out
}

export const padTo = (xs: number[], n: number) => Array.from({ length: n }, (_, i) => xs[i] ?? 0)

export interface DrawSummary {
  draw: Draw
  cap: number
  allocated: number
  headroom: number
  lines: number
}

export function drawSummaries(p: Project): DrawSummary[] {
  const al = allocate(p)
  return p.draws.map((d, i) => {
    const vals = Object.values(al).map(r => r[i])
    const allocated = cents(sum(vals))
    const cap = cents(d.capPct * p.loan)
    return { draw: d, cap, allocated, headroom: cents(cap - allocated), lines: vals.filter(v => v > 0).length }
  })
}

/** Drawn = money in funded draws. Balance = approved − drawn. */
export function lineDrawn(p: Project) {
  const al = allocate(p)
  const res: Record<string, { drawn: number; balance: number; lockedDraws: number[] }> = {}
  for (const l of resolve(p)) {
    const row = al[l.id] ?? []
    const funded = p.draws.map((d, i) => (d.status === 'funded' ? i : -1)).filter(i => i >= 0)
    const drawn = cents(sum(funded.map(i => row[i] ?? 0)))
    res[l.id] = { drawn, balance: cents(l.approved - drawn), lockedDraws: funded.filter(i => (row[i] ?? 0) > 0) }
  }
  return res
}

export function totals(p: Project) {
  const lines = resolve(p)
  const loanLines = lines.filter(inLoan)
  const drawn = lineDrawn(p)
  return {
    amount: cents(sum(loanLines.map(l => l.amount))),
    approved: cents(sum(loanLines.map(l => l.approved))),
    paid: cents(sum(lines.map(l => l.paid))),
    drawn: cents(sum(loanLines.map(l => drawn[l.id].drawn))),
    outside: cents(sum(lines.filter(l => !inLoan(l)).map(l => l.amount))),
  }
}

export interface Warning { level: 'warn' | 'error'; text: string; lineId?: string; drawIdx?: number }

export function warnings(p: Project): Warning[] {
  const w: Warning[] = []
  const lines = resolve(p)
  for (const s of drawSummaries(p)) {
    if (s.headroom < -0.005)
      w.push({ level: 'warn', drawIdx: p.draws.indexOf(s.draw), text: `${s.draw.name} is ${fmt(-s.headroom)} over the bank's ${Math.round(s.draw.capPct * 100)}% (${fmt(s.cap)}).` })
  }
  const capSum = sum(p.draws.map(d => d.capPct))
  if (Math.abs(capSum - 1) > 1e-6) w.push({ level: 'warn', text: `The bank's draw percentages add up to ${Math.round(capSum * 1000) / 10}%, not 100%.` })
  const trackUsed = lines.some(l => l.alloc.mode === 'track')
  if (trackUsed && Math.abs(sum(padTo(p.track, p.draws.length)) - 1) > 1e-6)
    w.push({ level: 'error', text: `The construction track adds up to ${Math.round(sum(p.track) * 1000) / 10}%, so some approved money is not in any draw.` })
  for (const l of lines) {
    if (l.alloc.mode === 'split' && Math.abs(sum(padTo(l.alloc.pct, p.draws.length)) - 1) > 1e-6)
      w.push({ level: 'error', lineId: l.id, text: `${l.name}: its split adds up to ${Math.round(sum(l.alloc.pct) * 1000) / 10}%.` })
    if (inLoan(l) && !['gcfee', 'contingency', 'item'].includes(l.kind) && l.amount - l.approved > 0.005) {
      const covered = lines.filter(x => x.kind === 'item' && x.coversId === l.id).reduce((a, x) => a + x.approved, 0)
      const gap = cents(l.amount - l.approved - covered)
      if (gap > 0.005) w.push({ level: 'warn', lineId: l.id, text: `${l.name} is ${fmt(gap)} over what the bank approved. Pay the difference from contingency.` })
    }
  }
  const pool = lines.find(l => l.kind === 'contingency')
  if (pool && pool.approved < -0.005) w.push({ level: 'error', text: `The budget is ${fmt(-pool.approved)} over the loan: contingency is negative.` })
  const drawn = lineDrawn(p)
  for (const l of lines) if (drawn[l.id] && drawn[l.id].balance < -0.005)
    w.push({ level: 'error', lineId: l.id, text: `${l.name} has been drawn ${fmt(-drawn[l.id].balance)} past its approved amount.` })
  return w
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

let seq = 0
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`
