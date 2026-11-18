import { describe, it, expect } from 'vitest'
import { resolve, allocate, drawSummaries, gcBase, houseDeposit, contingencyOriginal, totals, warnings, type Project } from './budget'
import { calcBlue, serviceAmount, solveMargin, splitFromEstimate, type Blue } from './blue'
import { jobProject, jobBlue, jobBlueAsSent, ESTIMATE_TOTAL } from '../data/job'

const c = (n: number) => Math.round(n * 100) / 100
const byId = (p: Project) => Object.fromEntries(resolve(p).map(l => [l.id, l]))

// Sheet figures are the client's own; the rest follow from the answers recorded in questions.ts.
describe('costing sheet + draw sheet', () => {
  it('approved lines add up to the $443,000 loan', () => {
    expect(totals(jobProject).approved).toBe(443000)
  })
  it('the house line is the final estimate total, $169,987 (Q1)', () => {
    expect(ESTIMATE_TOTAL).toBe(169987)
    expect(byId(jobProject).pa.approved).toBe(169987)
  })
  it('GC fee = 10% of the $212,565 site-work base (PM sheet E18)', () => {
    expect(gcBase(jobProject, 'approved')).toBe(212565)
    expect(byId(jobProject).gcfee.approved).toBe(21256.5)
  })
  it('contingency is the gap to the loan: $24,131.50 ($995 less than the sheet, Q1)', () => {
    expect(contingencyOriginal(jobProject)).toEqual({ original: 24131.5, used: 0, remaining: 24131.5 })
  })
  it('house deposit is 35% of the house line + transport, rounded like the sheet', () => {
    expect(houseDeposit(jobProject)).toEqual({ basis: 178547, deposit: 62491 })
    expect(allocate(jobProject).pa).toEqual([62491, 107496, 0])
  })
  it('draws tie out: draw 1 $111,594.25, caps 25 / 65 / 10, everything + contingency = loan', () => {
    const [d1, d2, d3] = drawSummaries(jobProject)
    expect(d1.allocated).toBe(111594.25)
    expect([d1.cap, d2.cap, d3.cap]).toEqual([110750, 287950, 44300])
    expect(c(d1.allocated + d2.allocated + d3.allocated + 24131.5)).toBe(443000)
  })
  it('flags draws over the bank\'s share as warnings, never errors', () => {
    const w = warnings(jobProject)
    expect(w.some(x => x.drawIdx === 2 && x.level === 'warn')).toBe(true)
    expect(w.some(x => x.level === 'error')).toBe(false)
  })
  it('a 10/40/40/10 construction track splits a line across four draws and adds back up', () => {
    const p: Project = {
      ...jobProject,
      draws: [...jobProject.draws, { id: 'd4', name: 'Draw 4', capPct: 0, status: 'planned' }],
      track: [0.1, 0.4, 0.4, 0.1],
      lines: jobProject.lines.map(l => (l.id === 'well' ? { ...l, alloc: { mode: 'track' } } : l)),
    }
    expect(allocate(p).well).toEqual([4000, 16000, 16000, 4000])
  })
})

describe('Blue Sheet formulas', () => {
  const master: Blue = {
    wholesale: 49941, uniFrame: 0, salesTax: 0, tariffPct: 0, marginPct: 0.2, oneOffPct: 0, frameCredit: 3000,
    services: [
      { id: 'viz', name: 'VIZ Graphics', payee: 'Eric', mode: 'fixed', value: 15000 },
      { id: 'mbi', name: 'MBi Building Systems', payee: 'Kevin', mode: 'fixed', value: 15000 },
      { id: 'merlin', name: 'Merlin AI', payee: 'Merlin', mode: 'pctTM', value: 0.01 },
    ],
  }
  it('BLUE SHEET MASTER - PROFIT MARGINS: retail $96,528.49, net $19,088.08', () => {
    const r = calcBlue(master)
    expect(c(r.services)).toBe(30499.41)
    expect(c(r.retail)).toBe(96528.49)
    expect(c(r.net)).toBe(19088.08)
  })
  it('this job\'s Blue Sheet as sent: retail $175,091.76, net $26,234.21', () => {
    const r = calcBlue(jobBlueAsSent)
    expect(c(r.subtotal)).toBe(151857.55)
    expect(c(r.retail)).toBe(175091.76)
    expect(c(r.net)).toBe(26234.21)
  })
  it('Daughtrey Blue Sheet: 10% tariff on the house, 24% margin on the subtotal = $142,110.66', () => {
    const r = calcBlue({ ...master, wholesale: 96799, tariffPct: 0.1, marginPct: 0.24, frameCredit: 3000,
      services: [{ id: 'viz', name: 'VIZ', payee: '', mode: 'fixed', value: 5000 }, { id: 'mbi', name: 'MBi', payee: '', mode: 'fixed', value: 5000 }] })
    expect(c(r.tariff)).toBe(9679.9)
    expect(c(r.margin)).toBe(25631.76)
    expect(c(r.retail)).toBe(142110.66)
  })
  it('solving the margin lands retail exactly on the estimate', () => {
    const m = solveMargin(jobBlueAsSent, ESTIMATE_TOTAL)
    expect(c(calcBlue({ ...jobBlueAsSent, marginPct: m }).retail)).toBe(ESTIMATE_TOTAL)
  })
})

// The figures quoted in questions.ts and walkthrough.ts are computed here, not typed.
describe('numbers quoted in the questions and the presenter notes', () => {
  const split = splitFromEstimate(jobBlue, ESTIMATE_TOTAL)
  const lines = resolve(jobProject)
  const byCode = (codes: string[]) => lines.filter(l => codes.includes(l.code) && !['gcfee', 'contingency', 'outside'].includes(l.kind)).reduce((a, l) => a + l.approved, 0)
  it('Q1/Q13: margin left of the estimate is $17,030.87 = 11.13% of subtotal, 15.50% of factory; net $20,030.87', () => {
    expect(c(split.margin)).toBe(17030.87)
    expect(Math.round(split.pctOfSubtotal * 10000) / 100).toBe(11.13)
    expect(Math.round(split.pctOfFactory * 10000) / 100).toBe(15.5)
    expect(c(split.net)).toBe(20030.87)
  })
  it('Q17: the hidden split adds up exactly to the house line', () => {
    const parts = jobBlue.wholesale + jobBlue.uniFrame + jobBlue.salesTax + split.tariff +
      jobBlue.services.reduce((a, s) => a + serviceAmount(jobBlue, s), 0) + split.margin
    expect(c(parts)).toBe(byId(jobProject).pa.approved)
  })
  it('Q3: 10% of whole cost codes 3000–7000 = $21,756, $499.50 over the approved fee', () => {
    const fee = c(0.1 * byCode(['3000', '4000', '5000', '6000', '7000']))
    expect(fee).toBe(21756)
    expect(c(fee - 21256.5)).toBe(499.5)
  })
  it('Q6: paying the double draws from contingency would leave $3,481.50', () => {
    expect(c(contingencyOriginal(jobProject).original - 20000 - 650)).toBe(3481.5)
  })
  it('Q12/Q18: Merlin AI is $1,098.58 on the factory price, $1,699.87 on the estimate total', () => {
    expect(c(serviceAmount(jobBlue, jobBlue.services.find(s => s.id === 'merlin')!))).toBe(1098.58)
    expect(c(0.01 * ESTIMATE_TOTAL)).toBe(1699.87)
  })
  it('walkthrough: at the sheet\'s 15.3% the estimate would be $176,358.41', () => {
    expect(c(calcBlue({ ...jobBlue, marginPct: 0.153 }).retail)).toBe(176358.41)
  })
  it('Q7: draw 3 is $4,328.25 over the bank\'s 10%', () => {
    expect(drawSummaries(jobProject)[2].headroom).toBe(-4328.25)
  })
})
