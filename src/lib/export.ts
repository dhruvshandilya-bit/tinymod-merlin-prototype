import * as XLSX from 'xlsx'
import { allocate, contingencyOriginal, inLoan, resolve, type Project } from './budget'
import { serviceAmount, type Blue } from './blue'
import type { Step } from '../data/job'

const col = (i: number) => XLSX.utils.encode_col(i)
const money = '"$"#,##0.00'

function setFormula(ws: XLSX.WorkSheet, ref: string, f: string, fmt = money) {
  ws[ref] = { t: 'n', f, z: fmt }
  // Cells outside !ref are ignored by Excel, so grow the range to include formulas added after aoa_to_sheet.
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  const cell = XLSX.utils.decode_cell(ref)
  range.e.r = Math.max(range.e.r, cell.r)
  range.e.c = Math.max(range.e.c, cell.c)
  ws['!ref'] = XLSX.utils.encode_range(range)
}

/**
 * The bank sheet in the client's current "Draw & Budget Master" layout, with live formulas:
 * draw values = % × loan, Total Drawn = funded draws only, Balance = Lender Amt − Total Drawn.
 */
export function exportDraws(p: Project) {
  const n = p.draws.length
  const lines = resolve(p).filter(l => inLoan(l) && l.kind !== 'contingency')
  const al = allocate(p)
  const cont = contingencyOriginal(p)
  const first = 2 // column C holds Lender Amt; draws start at E
  const dc = (i: number) => col(first + 2 + i) // E, F, G…
  const totalDrawnCol = col(first + 2 + n)
  const balanceCol = col(first + 3 + n)
  const notesCol = col(first + 4 + n)
  const nextDraw = p.draws.findIndex(d => d.status !== 'funded')

  const aoa: any[][] = []
  aoa[0] = ['', 'VALUE OF DRAW PERCENTAGES']
  aoa[1] = ['', 'ACTUAL DRAW AMOUNTS']
  aoa[2] = ['', '', '', 'SURPLUS']
  aoa[3] = ['', 'STATUS', '', '', ...p.draws.map(d => d.status.toUpperCase())]
  aoa[4] = ['', `${p.customer.toUpperCase()} HOME LOAN`, 'Draw Schedule', '', ...p.draws.map(d => d.capPct)]
  aoa[5] = ['', 'Name', 'Lender Amt', 'Draw Request', ...p.draws.map((_, i) => i + 1), 'Total Drawn', 'Balance Remaining', 'Notes']
  const rowsStart = 7 // Excel row number of the first line
  const body = [...lines, { id: 'contingency', name: `Contingency (original ${cont.original.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})`, approved: cont.remaining, note: 'Remaining after contingency items' } as any]
  body.forEach((l, k) => {
    const row = al[l.id] ?? Array(n).fill(0)
    aoa[rowsStart - 1 + k] = ['', l.name, l.approved, nextDraw >= 0 ? row[nextDraw] || '' : '', ...row.map((v: number) => v || ''), '', '', l.note ?? '']
  })
  const lastRow = rowsStart - 1 + body.length
  const totalRow = lastRow + 2
  aoa[totalRow - 1] = ['', 'Total']
  aoa[totalRow + 1] = ['', '', '', 'Loan Amount', p.loan]
  aoa[totalRow + 2] = ['', '', '', 'Loan not yet drawn']

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const fundedCols = p.draws.map((d, i) => (d.status === 'funded' ? dc(i) : null)).filter(Boolean) as string[]
  for (let r = rowsStart; r <= lastRow; r++) {
    for (const c of ['C', 'D', ...p.draws.map((_, i) => dc(i))]) if (ws[`${c}${r}`]) ws[`${c}${r}`].z = money
    setFormula(ws, `${totalDrawnCol}${r}`, fundedCols.length ? fundedCols.map(c => `${c}${r}`).join('+') : '0')
    setFormula(ws, `${balanceCol}${r}`, `C${r}-${totalDrawnCol}${r}`)
  }
  for (const c of ['C', 'D', ...p.draws.map((_, i) => dc(i)), totalDrawnCol, balanceCol])
    setFormula(ws, `${c}${totalRow}`, `SUM(${c}${rowsStart}:${c}${lastRow})`)
  p.draws.forEach((_, i) => {
    const c = dc(i)
    setFormula(ws, `${c}1`, `${c}5*$E$${totalRow + 2}`)
    setFormula(ws, `${c}2`, `${c}${totalRow}`)
    setFormula(ws, `${c}3`, `${c}1-${c}2`)
    ws[`${c}5`].z = '0%'
  })
  setFormula(ws, `${col(first + 2 + n)}1`, p.draws.map((_, i) => `${dc(i)}1`).join('+'))
  ws[`E${totalRow + 2}`].z = money
  setFormula(ws, `E${totalRow + 3}`, `E${totalRow + 2}-${totalDrawnCol}${totalRow}`)
  ws['!cols'] = [{ wch: 2 }, { wch: 46 }, { wch: 14 }, { wch: 14 }, ...p.draws.map(() => ({ wch: 14 })), { wch: 14 }, { wch: 16 }, { wch: 60 }]
  void notesCol

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Original Budget')
  XLSX.writeFile(wb, `Draw & Budget Master - ${p.customer}.xlsx`)
}

/** The costing sheet in the Project Management layout. Balance due is per line (the sheet's running balance skipped rows). */
export function exportCosting(p: Project, steps: Step[]) {
  const lines = resolve(p)
  const stepById = Object.fromEntries(steps.map(s => [s.id, s]))
  const label: Record<string, string> = { not_started: '', in_progress: 'IN PROCESS', done: 'DONE', na: 'N/A' }
  const aoa: any[][] = [
    ['', 'CONFIDENTIAL PROJECT MANAGEMENT DOCUMENT'],
    ['NAME', p.customer],
    [],
    ['', 'PROJECT STEPS', 'IN PROCESS', 'DATE COMPLETED', 'BID TOTAL', 'PAID', 'BALANCE DUE', 'CONTRACTOR', 'NOTES', 'STAGE', 'BANK APPROVED'],
  ]
  const start = aoa.length + 1
  lines.forEach(l => {
    const s = l.stepId ? stepById[l.stepId] : undefined
    aoa.push(['', l.name, s ? label[s.status] : '', s?.status === 'done' ? s.end : '', l.amount, l.paid, '', l.contractor ?? '', l.note ?? '', l.stage, inLoan(l) ? l.approved : 'Not in loan'])
  })
  const end = aoa.length
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  for (let r = start; r <= end; r++) {
    ws[`E${r}`].z = money
    ws[`F${r}`].z = money
    if (typeof ws[`K${r}`]?.v === 'number') ws[`K${r}`].z = money
    setFormula(ws, `G${r}`, `E${r}-F${r}`)
  }
  setFormula(ws, `E${end + 2}`, `SUM(E${start}:E${end})`)
  setFormula(ws, `F${end + 2}`, `SUM(F${start}:F${end})`)
  setFormula(ws, `G${end + 2}`, `SUM(G${start}:G${end})`)
  ws['!cols'] = [{ wch: 2 }, { wch: 46 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 24 }, { wch: 60 }, { wch: 8 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Project Management')
  XLSX.writeFile(wb, `Project Management & Cost Model - ${p.customer}.xlsx`)
}

/** The Blue Sheet as the split of the final estimate (Q1, Q17), with live formulas. One-off is gone (Q14). */
export function exportBlue(b: Blue, customer: string, estimate: number) {
  const aoa: any[][] = [
    ['TINYMOD MODULAR BLUE SHEET', '', 'INTERNAL ONLY'],
    [customer],
    [],
    ['Estimate total (final)', estimate],
    [],
    ['TM (wholesale)', b.wholesale],
    ['Uni-Frame', b.uniFrame],
    ['Modular totals'],
    ['Additional project services', '', '%'],
    ...b.services.map(s => [s.name, serviceAmount(b, s), s.mode === 'pctTM' ? s.value : '']),
    ['Project services'],
    ['Sales tax', b.salesTax],
    ['Sub totals'],
    ['Tariff', '', b.tariffPct],
    ['TinyMod margin (estimate − sub totals − tariff)'],
    ['Margin % of sub totals'],
    ['Frame return credit', b.frameCredit],
    ['TINYMOD NET'],
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const R = (label: string) => aoa.findIndex(x => x[0] === label) + 1
  const svcStart = R('Additional project services') + 1, svcEnd = svcStart + b.services.length - 1
  b.services.forEach((s, k) => { if (s.mode === 'pctTM') setFormula(ws, `B${svcStart + k}`, `C${svcStart + k}*B${R('TM (wholesale)')}`) })
  setFormula(ws, `B${R('Modular totals')}`, `B${R('TM (wholesale)')}+B${R('Uni-Frame')}`)
  setFormula(ws, `B${R('Project services')}`, `SUM(B${svcStart}:B${svcEnd})`)
  setFormula(ws, `B${R('Sub totals')}`, `B${R('Sales tax')}+B${R('Modular totals')}+B${R('Project services')}`)
  setFormula(ws, `B${R('Tariff')}`, `B${R('TM (wholesale)')}*C${R('Tariff')}`)
  const m = R('TinyMod margin (estimate − sub totals − tariff)')
  setFormula(ws, `B${m}`, `B${R('Estimate total (final)')}-B${R('Sub totals')}-B${R('Tariff')}`)
  setFormula(ws, `B${R('Margin % of sub totals')}`, `B${m}/B${R('Sub totals')}`, '0.00%')
  setFormula(ws, `B${R('TINYMOD NET')}`, `B${m}+B${R('Frame return credit')}`)
  for (const k of Object.keys(ws)) if (/^B\d+$/.test(k) && typeof ws[k].v === 'number' && !ws[k].z) ws[k].z = money
  for (const k of Object.keys(ws)) if (/^C\d+$/.test(k) && typeof ws[k].v === 'number') ws[k].z = '0.0%'
  ws['!cols'] = [{ wch: 44 }, { wch: 16 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'TINYMOD')
  XLSX.writeFile(wb, `Blue Sheet - ${customer}.xlsx`)
}
