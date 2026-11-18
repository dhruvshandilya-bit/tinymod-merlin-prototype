import { describe, it, expect } from 'vitest'
import { resolve, allocate, drawSummaries, gcBase, houseDeposit, contingencyOriginal, totals, warnings, type Project } from './budget'
import { calcBlue, solveMargin, type Blue } from './blue'
import { jobProject, jobBlue } from '../data/job'

const c = (n: number) => Math.round(n * 100) / 100
const byId = (p: Project) => Object.fromEntries(resolve(p).map(l => [l.id, l]))

// Every expected figure below is printed on the client's own sheets.
describe('this job costing sheet + draw sheet', () => {
  it('approved lines add up to the $443,000 loan', () => {
    expect(totals(jobProject).approved).toBe(443000)
  })
  it('GC fee = 10% of the $212,565 site-work base (PM sheet E18)', () => {
    expect(gcBase(jobProject, 'approved')).toBe(212565)
    expect(byId(jobProject).gcfee.approved).toBe(21256.5)
  })
  it('contingency is the gap to the loan: $25,126.50', () => {
    expect(contingencyOriginal(jobProject)).toEqual({ original: 25126.5, used: 0, remaining: 25126.5 })
  })
  it('house deposit is 35% of purchase agreement + transport, rounded like the sheet', () => {
    expect(houseDeposit(jobProject)).toEqual({ basis: 177552, deposit: 62143 })
    expect(allocate(jobProject).pa).toEqual([62143, 106849, 0])
  })
  it('draw 1 = the sheet\'s Draw Request column ($111,246.25), each line drawn once', () => {
    const [d1, d2, d3] = drawSummaries(jobProject)
    expect(d1.allocated).toBe(111246.25)
    expect(d1.cap).toBe(110750)
    expect(d2.cap).toBe(287950)
    expect(d3.cap).toBe(44300)
    expect(c(d1.allocated + d2.allocated + d3.allocated + 25126.5)).toBe(443000)
  })
  it('flags draw 3 over the bank\'s 10% (warn, not block)', () => {
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
    const row = allocate(p).well
    expect(row).toEqual([4000, 16000, 16000, 4000])
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
  it('this job Blue Sheet: retail $175,091.76, net $26,234.21', () => {
    const r = calcBlue(jobBlue)
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
    expect(c(r.net)).toBe(28631.76)
  })
  it('solving the margin lands retail exactly on the order form', () => {
    const m = solveMargin(jobBlue, 168992)
    expect(c(calcBlue({ ...jobBlue, marginPct: m }).retail)).toBe(168992)
  })
})

// The figures quoted in the open questions (src/data/questions.ts) are computed here, not typed.
describe('numbers quoted in the questions', () => {
  const lines = resolve(jobProject)
  const byCode = (codes: string[]) => lines.filter(l => codes.includes(l.code) && l.kind !== 'gcfee' && l.kind !== 'contingency' && l.kind !== 'outside').reduce((a, l) => a + l.approved, 0)
  it('Q3: 10% of whole cost codes 3000–7000 = $21,756, $499.50 over the approved fee', () => {
    const fee = c(0.1 * byCode(['3000', '4000', '5000', '6000', '7000']))
    expect(fee).toBe(21756)
    expect(c(fee - 21256.5)).toBe(499.5)
  })
  it('Q6: paying the double draws from contingency would leave $4,476.50', () => {
    expect(c(25126.5 - 20000 - 650)).toBe(4476.5)
  })
  it('Q12: adding the Merlin AI line (1% of TM) moves retail by $1,266.66', () => {
    const withMerlin = { ...jobBlue, services: jobBlue.services.map(s => (s.id === 'merlin' ? { ...s, value: 0.01 } : s)) }
    expect(c(calcBlue(withMerlin).retail - calcBlue(jobBlue).retail)).toBe(1266.66)
  })
  it('Q17: the hidden 9000 block holds $173,091.76 on this job', () => {
    const r = calcBlue(jobBlue)
    expect(c(jobBlue.wholesale + jobBlue.uniFrame + r.services + r.margin + r.oneOff)).toBe(173091.76)
  })
  it('Q18: Merlin AI on retail $1,689.92 vs on wholesale $1,098.58', () => {
    expect(c(0.01 * 168992)).toBe(1689.92)
    expect(c(0.01 * jobBlue.wholesale)).toBe(1098.58)
  })
  it('Q1: Blue Sheet retail vs Order Form #7 differs by $5,104.76; margin to match is 11.94%', () => {
    expect(c(calcBlue(jobBlue).retail - 169987)).toBe(5104.76)
    expect(Math.round(solveMargin(jobBlue, 169987) * 10000) / 100).toBe(11.94)
  })
})
