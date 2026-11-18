import type { Project, Line } from '../lib/budget'
import type { Blue } from '../lib/blue'
import { r, type Ref } from './sources'

/**
 * One TinyMod GC job, laid onto the TinyMod budget template that is already in Merlin (V384): same line names, same
 * cost codes, so an import merges into the seeded lines instead of duplicating them. Every amount carries the sheet
 * cell it came from. The homeowner is renamed because the site is public.
 */

export const PROJECT_META = {
  customer: 'Rowan Residence',
  place: 'Teller County, CO',
  model: 'SkyMod 780C · The Haven Custom',
  manufacturer: 'Skyline',
  pm: 'Eric Scott',
  jobNo: 'TM-1007',
}

const L = (l: Partial<Line> & Pick<Line, 'id' | 'code' | 'name' | 'amount'>): Line => ({
  kind: 'construction',
  approved: l.amount,
  stage: 'rough',
  paid: 0,
  gcBase: true,
  alloc: { mode: 'pin', draw: 1 },
  ...l,
})
const assumed = (note: string): Ref => r('ASSUMED', undefined, note)
const notDrawn = assumed('Not in any draw on the sheet; placed by when the step happens')

export const jobLines: Line[] = [
  // 1000 Pre-Construction & Design
  L({ id: 'feas', code: '1000', name: 'Feasibility & Custom Design', amount: 3500, kind: 'outside', gcBase: false, stage: 'final', alloc: { mode: 'none' },
      contractor: 'TinyMod, LLC', note: 'Invoiced on its own before the loan', refs: [r('PM', 'E8')], qs: ['Q9'] }),
  L({ id: 'permits', code: '1000', name: 'Apply for Permits - Home, Driveway', amount: 1565, stage: 'final', stepId: 's1', alloc: { mode: 'pin', draw: 0 },
      contractor: 'PM & TinyMod', refs: [r('PM', 'E21', '$1,500 home'), r('PM', 'E45', '$65 driveway'), r('DRAW', 'C7')], allocRef: r('DRAW', 'E7') }),
  L({ id: 'drawings', code: '1000', name: 'Foundation Construction Drawings', amount: 2000, stage: 'final', stepId: 's5', alloc: { mode: 'pin', draw: 0 },
      contractor: 'Structural engineer', refs: [r('PM', 'E30'), r('DRAW', 'C15')], allocRef: r('DRAW', 'E15') }),
  L({ id: 'builders', code: '1000', name: 'Builders Risk Policy', amount: 6500, gcBase: false, stepId: 's27',
      refs: [r('DRAW', 'C33', 'not on the PM sheet')], allocRef: notDrawn }),
  L({ id: 'setbacks', code: '1000', name: 'Setbacks / Zoning / Beacon', amount: 0, refs: [r('PM', 'B9:B11', 'covered in feasibility fee')] }),
  L({ id: 'siteplan', code: '1000', name: 'Concept & Complete Site Plan', amount: 0, refs: [r('PM', 'B14, B17')] }),
  L({ id: 'planreview', code: '1000', name: '3rd-Party Plan Approval / Plan Review', amount: 0, refs: [r('PM', 'B19:B20')] }),

  // 2000 Modular Unit
  L({ id: 'pa', code: '2000', name: 'Modular Unit Total (base + options + transport)', amount: 168992, kind: 'house', gcBase: false, stage: 'final',
      stepId: 'x-pa', alloc: { mode: 'house' }, contractor: 'TinyMod, LLC',
      note: 'Held at house & options only; transport is in 6000 so it is not counted twice',
      refs: [r('DRAW', 'C8', 'MOD purchase agreement'), r('PM', 'E15', '$177,552 incl. transport'), r('TPL', '2000', 'fromEstimateRetail')],
      allocRef: r('DRAW', 'E8 / F8', '$62,143 in draw 1, $106,849 in draw 2'), qs: ['Q1', 'Q2'] }),

  // 3000 Earthwork & Site Prep
  L({ id: 'profile', code: '3000', name: 'Profile Hole Excavation', amount: 500, stage: 'final', stepId: 's2', alloc: { mode: 'pin', draw: 0 },
      refs: [r('PM', 'E27'), r('DRAW', 'C12')], allocRef: r('DRAW', 'E12') }),
  L({ id: 'driveway', code: '3000', name: 'Driveway, Entrance, and RV Pad', amount: 8500, stepId: 's6',
      refs: [r('PM', 'E32'), r('DRAW', 'C16')], allocRef: r('DRAW', 'F16') }),
  L({ id: 'excavation', code: '3000', name: 'Excavation and Backfill House Site', amount: 25000, stepId: 's8',
      refs: [r('PM', 'E33'), r('DRAW', 'C17')], allocRef: r('DRAW', 'F17') }),
  L({ id: 'rock', code: '3000', name: 'Rock Hammering and Blasting', amount: 20000, stepId: 's9', alloc: { mode: 'pin', draw: 0 },
      refs: [r('PM', 'E34'), r('DRAW', 'C18')], allocRef: r('DRAW', 'D18', 'Draw Request column; the sheet also put it in F18'), qs: ['Q6'] }),
  L({ id: 'clear', code: '3000', name: 'Clear Building Site of Trees', amount: 0, refs: [r('PM', 'E25', 'N/A')] }),
  L({ id: 'survey', code: '3000', name: 'Survey / Stake', amount: 0, refs: [r('PM', 'E26')] }),

  // 4000 Foundation
  L({ id: 'crawl', code: '4000', name: 'Crawlspace Foundation', amount: 22500, stepId: 's11',
      refs: [r('PM', 'E37'), r('DRAW', 'C20')], allocRef: r('DRAW', 'F20') }),
  L({ id: 'sill', code: '4000', name: 'Sill Plate, Vapor Barrier and Insulation + door', amount: 6500, stepId: 's12',
      refs: [r('PM', 'E39'), r('DRAW', 'C21')], allocRef: notDrawn }),
  L({ id: 'damp', code: '4000', name: 'Dampproofing Foundation', amount: 650, stepId: 's13',
      refs: [r('PM', 'E40'), r('DRAW', 'C22')], allocRef: r('DRAW', 'F22', 'the sheet also put it in E22'), qs: ['Q6'] }),
  L({ id: 'flatwork', code: '4000', name: 'Flatwork / Concrete Slabs', amount: 8000, stepId: 's16',
      refs: [r('PM', 'E46'), r('DRAW', 'C25')], allocRef: notDrawn }),

  // 5000 Utilities
  L({ id: 'soil', code: '5000', name: 'Soil Testing Report', amount: 850, stage: 'final', stepId: 's3', alloc: { mode: 'pin', draw: 0 },
      refs: [r('PM', 'E28'), r('DRAW', 'C13')], allocRef: r('DRAW', 'E13') }),
  L({ id: 'septicdesign', code: '5000', name: 'Septic Testing, Report & Engineered Septic Design', amount: 5000, stage: 'final', stepId: 's4', alloc: { mode: 'pin', draw: 0 },
      refs: [r('PM', 'E29'), r('DRAW', 'C14')], allocRef: r('DRAW', 'E14') }),
  L({ id: 'septic', code: '5000', name: 'Septic System & Piping to House', amount: 25000, stepId: 's10',
      refs: [r('PM', 'E36'), r('DRAW', 'C19')], allocRef: r('DRAW', 'F19') }),
  L({ id: 'well', code: '5000', name: 'Well', amount: 40000, stepId: 's14',
      refs: [r('PM', 'E41'), r('DRAW', 'C23')], allocRef: notDrawn }),
  L({ id: 'power', code: '5000', name: 'Electricity From Road', amount: 8500, stepId: 's15',
      refs: [r('PM', 'E44'), r('DRAW', 'C24')], allocRef: r('DRAW', 'F24') }),
  L({ id: 'trench', code: '5000', name: 'Electric Trench', amount: 0, refs: [r('PM', 'E35')] }),
  L({ id: 'propane', code: '5000', name: 'Propane Tank', amount: 0, refs: [r('PM', 'E57', 'if applicable, needs a bid')] }),

  // 6000 Delivery, Set & Finish
  L({ id: 'transport', code: '6000', name: 'MOD Transportation Allowance', amount: 8560, kind: 'house', gcBase: false, stage: 'final', stepId: 'x-deliver',
      alloc: { mode: 'pin', draw: 0 }, contractor: 'Modular trucking company', note: 'Paid inside the purchase agreement',
      refs: [r('DRAW', 'C10'), r('PM', 'I48', 'note says "$8,500 will be paid in purchase agreement"')], allocRef: r('DRAW', 'E10'), qs: ['Q2'] }),
  L({ id: 'crane', code: '6000', name: 'Crane Cost', amount: 2500, stepId: 's17', alloc: { mode: 'pin', draw: 2 }, contractor: 'Crane company',
      refs: [r('PM', 'E49'), r('DRAW', 'C26')], allocRef: notDrawn }),
  L({ id: 'setcrew', code: '6000', name: 'Modular Set Crew Cost & Per Diem', amount: 7500, stepId: 's18', alloc: { mode: 'pin', draw: 2 }, contractor: 'Mod set crew',
      refs: [r('PM', 'E50'), r('DRAW', 'C27')], allocRef: notDrawn }),
  L({ id: 'finish', code: '6000', name: 'Modular Exterior & Interior Finish Crew Cost', amount: 8000, stepId: 's19', alloc: { mode: 'pin', draw: 2 }, contractor: 'Finish crews',
      refs: [r('PM', 'E52'), r('DRAW', 'C28')], allocRef: notDrawn }),
  L({ id: 'roof', code: '6000', name: 'Roof Build & Shingles', amount: 0, refs: [r('PM', 'E51', 'N/A')] }),

  // 7000 Final Connections & Inspection
  L({ id: 'appliances', code: '7000', name: 'Appliance Allowance', amount: 6000, stepId: 'x-appl', alloc: { mode: 'pin', draw: 2 },
      note: 'Order form omits the factory fridge and range; the owner buys them locally',
      refs: [r('PM', 'E59'), r('DRAW', 'C11'), r('OF7', 'E68, E70', 'omit std refrigerator & range')], allocRef: notDrawn }),
  L({ id: 'stateinsp', code: '7000', name: 'State Inspection Fee (Modular)', amount: 500, stepId: 's21', alloc: { mode: 'pin', draw: 2 },
      refs: [r('PM', 'E53'), r('DRAW', 'C29')], allocRef: notDrawn }),
  L({ id: 'watersewer', code: '7000', name: 'Final Water & Sewer Connections to Home', amount: 5500, stepId: 's22', alloc: { mode: 'pin', draw: 2 },
      refs: [r('PM', 'E54'), r('DRAW', 'C30')], allocRef: notDrawn }),
  L({ id: 'elecfinish', code: '7000', name: 'Finish Electrical Connections to Modular Panel', amount: 6500, stepId: 's24', alloc: { mode: 'pin', draw: 2 },
      refs: [r('PM', 'E56'), r('DRAW', 'C31')], allocRef: notDrawn }),
  L({ id: 'gutters', code: '7000', name: 'Install Gutters', amount: 1500, stepId: 's25', alloc: { mode: 'pin', draw: 2 },
      refs: [r('PM', 'E58'), r('DRAW', 'C32')], allocRef: notDrawn }),
  L({ id: 'air', code: '7000', name: 'Central Air', amount: 0, refs: [r('PM', 'E55', 'if applicable')] }),
  L({ id: 'grade', code: '7000', name: 'Final Grade / Landscape', amount: 0, stepId: 's26', refs: [r('PM', 'E60', 'customer responsibility')] }),
  L({ id: 'walk', code: '7000', name: 'Blue-Tape Walk / C of O', amount: 0, stepId: 'x-co', refs: [r('PM', 'B61:B63')] }),

  // 8000 Project Services & Fees
  L({ id: 'gcfee', code: '8000', name: 'General Contracting Fee', amount: 0, kind: 'gcfee', gcBase: false, stage: 'final',
      alloc: { mode: 'split', pct: [0.5, 0, 0.5] }, contractor: 'TinyMod, LLC',
      refs: [r('PM', 'E18', '=SUM(E21,E25:E46,E48:E60)*10%'), r('DRAW', 'C9'), r('TPL', 'GC_FEE', '15% of 3000–7000')],
      allocRef: r('DRAW', 'E9 / G9', '"50% upfront - 50% upon completion" (J9)'), qs: ['Q3'] }),
  L({ id: 'contingency', code: '8000', name: 'Contingency', amount: 0, kind: 'contingency', gcBase: false, alloc: { mode: 'none' },
      note: 'Whatever is left of the loan. Overruns are paid out of it as contingency items', refs: [r('DRAW', 'C34', 'typed $25,126.50 = the gap to the loan')], qs: ['Q10'] }),
  L({ id: 'salestax', code: '8000', name: 'Sales Tax', amount: 0, gcBase: false, alloc: { mode: 'none' },
      refs: [r('TPL', '8000', 'not on the bank sheet; house sales tax sits inside the house price (Blue Sheet K34)')] }),
]

export const jobProject: Project = {
  customer: PROJECT_META.customer,
  bank: 'Construction lender',
  loan: 443000,
  gcRate: 0.1,
  draws: [
    { id: 'd1', name: 'Draw 1', capPct: 0.25, status: 'funded', date: '2026-11-10', stepId: 'x-close',
      refs: [r('DRAW', 'E5', '25%'), r('ASSUMED', undefined, 'The sheet has no draw dates (J1:J3 blank); draw 1 is shown funded so you can see how funding locks money')] },
    { id: 'd2', name: 'Draw 2', capPct: 0.65, status: 'planned', stepId: 'x-ship', refs: [r('DRAW', 'F5', '65%')] },
    { id: 'd3', name: 'Draw 3', capPct: 0.1, status: 'planned', stepId: 'x-co', refs: [r('DRAW', 'G5', '10%')] },
  ],
  house: { depositPct: 0.35, depositDraw: 0, balanceDraw: 1 },
  track: [0.25, 0.65, 0.1],
  lines: jobLines,
}

/** This job's own Blue Sheet. It predates the Merlin AI line, so that service is set to 0%. */
export const jobBlue: Blue = {
  wholesale: 109857.55,
  uniFrame: 0,
  services: [
    { id: 'viz', name: 'VIZ Graphics', payee: 'Eric', mode: 'fixed', value: 20000 },
    { id: 'mbi', name: 'MBi Building Systems', payee: 'Kevin', mode: 'fixed', value: 20000 },
    { id: 'merlin', name: 'Merlin AI (mod total)', payee: 'Merlin', mode: 'pctTM', value: 0 },
  ],
  salesTax: 2000,
  tariffPct: 0,
  marginPct: 0.153,
  oneOffPct: 0,
  frameCredit: 3000,
}

export const BLUE_REFS: Record<string, Ref[]> = {
  wholesale: [r('BLUE', 'G29')],
  uniFrame: [r('BLUE', 'G24')],
  viz: [r('BLUE', 'K28')],
  mbi: [r('BLUE', 'K29')],
  merlin: [r('BLUEM', 'K30', '=L30*G29, 1% on the master'), r('BLUE', 'no row')],
  salesTax: [r('BLUE', 'K34', '"60% of invoice"')],
  tariffPct: [r('BLUE', 'L45', 'blank = 0%')],
  marginPct: [r('BLUE', 'L46')],
  oneOffPct: [r('BLUE', 'L47', 'blank = 0%')],
  frameCredit: [r('BLUE', 'K49')],
  modular: [r('BLUEM', 'G35', '=SUM(G29:G34)')],
  services: [r('BLUEM', 'K31', '=SUM(K28:K30)')],
  subtotal: [r('BLUEM', 'K44', '=SUM(K34:K43)')],
  tariff: [r('BLUEM', 'K45', '=G29*L45')],
  margin: [r('BLUEM', 'K46', '=L46*K44')],
  oneOff: [r('BLUEM', 'K47', '=K46*L47')],
  retail: [r('BLUEM', 'K48', '=SUM(K44:K47)')],
  net: [r('BLUEM', 'K50', '=K46+K47+K49')],
}

/** Order Form #7 as entered: only the X-marked options with a price (standard items are in the base). */
export interface Option { label: string; price: number; group: string; ref: Ref }
export const ORDER_FORM = {
  number: 7,
  date: '2026-05-22',
  product: 'SKYMOD',
  model: '780C',
  sqft: 1001,
  bedrooms: 2,
  basePrice: 158159,
  baseRef: r('OF7', 'AB71'),
  totalRef: r('OF7', 'AB77', '=SUM(AB71:AB76)'),
  optionsRef: r('OF7', 'AB72', '=AO75 = SUM(B17:B77) + SUM(M17:M77)'),
  transport: 0, surcharge: 0, craneSetFinish: 0,
  rowRefs: { transport: r('OF7', 'AB74', 'blank on the form'), surcharge: r('OF7', 'AB75'), craneSetFinish: r('OF7', 'AB76', 'blank: set & finish crews sit on the budget') },
  options: [
    { group: 'Exterior construction & materials', label: '60 lb snow load', price: 1007, ref: r('OF7', 'B28') },
    { group: 'Exterior construction & materials', label: 'Ice / water shield', price: 2200, ref: r('OF7', 'B31') },
    { group: 'Exterior construction & materials', label: 'Composite deck upgrade', price: 1411, ref: r('OF7', 'B33') },
    { group: 'Exterior construction & materials', label: "6' full end porch, composite", price: 1395, ref: r('OF7', 'B37') },
    { group: 'Building features', label: '36" 20-minute fire door', price: 350, ref: r('OF7', 'M18') },
    { group: 'Building features', label: 'Sliding patio door', price: 1200, ref: r('OF7', 'M19') },
    { group: 'Building features', label: 'High-rise gooseneck kitchen faucet', price: 125, ref: r('OF7', 'M35') },
    { group: 'Building features', label: 'Farm-style kitchen sink', price: 250, ref: r('OF7', 'M36') },
    { group: 'Utilities & baths', label: '50 gallon electric water heater', price: 280, ref: r('OF7', 'B52') },
    { group: 'Utilities & baths', label: 'Square sink', price: 250, ref: r('OF7', 'B56') },
    { group: 'Utilities & baths', label: '42"×60" Palisade shower', price: 1250, ref: r('OF7', 'B57') },
    { group: 'Utilities & baths', label: 'ADA tall commode', price: 125, ref: r('OF7', 'B58') },
    { group: 'Appliances', label: 'Omit standard refrigerator (ice maker prep)', price: -575, ref: r('OF7', 'B68') },
    { group: 'Appliances', label: 'Omit standard range', price: -415, ref: r('OF7', 'B70') },
    { group: 'Appliances', label: 'Prep for dishwasher', price: 35, ref: r('OF7', 'B74') },
    { group: 'Appliances', label: 'Garbage disposal', price: 155, ref: r('OF7', 'B76') },
    { group: 'Electrical', label: 'Pendant light with shade', price: 120, ref: r('OF7', 'M61') },
    { group: 'Electrical', label: 'Ceiling fans, living & bed', price: 750, ref: r('OF7', 'M62') },
    { group: 'Modular & state code', label: '2020 NEC mod code', price: 620, ref: r('OF7', 'M75') },
    { group: 'Modular & state code', label: '2021 IECC', price: 500, ref: r('OF7', 'M76') },
    { group: 'Modular & state code', label: '2021 IRC', price: 795, ref: r('OF7', 'M77') },
  ] as Option[],
}

export type StepStatus = 'not_started' | 'in_progress' | 'done' | 'na'
export interface Step {
  id: string
  no: string
  name: string
  start: string
  end: string
  status: StepStatus
  assignee?: string
  parent?: string
  /** Not in the uploaded template; added so the house and the draws have a step to hang off. */
  suggested?: boolean
}

/** The template as it sits on the project in Merlin (dates are the placeholder ones set on 10 Oct). */
export const jobSteps: Step[] = [
  { id: 'x-pa', no: '—', name: 'Purchase agreement signed: release house for production', start: '2026-11-03', end: '2026-11-03', status: 'done', suggested: true },
  { id: 'x-close', no: '—', name: 'Loan closes', start: '2026-11-10', end: '2026-11-10', status: 'done', suggested: true },
  { id: 's1', no: '1.0', name: 'Apply for Permits', start: '2026-11-12', end: '2026-11-14', status: 'in_progress' },
  { id: 's1a', no: '1.01', name: 'A. Driveway', start: '2026-11-12', end: '2026-11-12', status: 'in_progress', assignee: 'Kevin Lockhart', parent: 's1' },
  { id: 's1b', no: '1.02', name: 'B. Septic', start: '2026-11-12', end: '2026-11-13', status: 'not_started', parent: 's1' },
  { id: 's1c', no: '1.03', name: 'C. Home', start: '2026-11-13', end: '2026-11-14', status: 'not_started', parent: 's1' },
  { id: 's2', no: '2.0', name: 'Profile Hole Excavation', start: '2026-11-14', end: '2026-11-17', status: 'not_started' },
  { id: 's3', no: '3.0', name: 'Soil Testing Report', start: '2026-11-17', end: '2026-11-17', status: 'not_started' },
  { id: 's4', no: '4.0', name: 'Septic Testing, Report & Engineered Septic Design', start: '2026-11-18', end: '2026-11-18', status: 'not_started' },
  { id: 's5', no: '5.0', name: 'Foundation Construction Drawings', start: '2026-11-19', end: '2026-11-19', status: 'not_started' },
  { id: 's6', no: '6.0', name: 'Driveway & Entrance', start: '2026-11-19', end: '2026-11-20', status: 'not_started' },
  { id: 's7', no: '7.0', name: 'Garage & Other Buildings if applicable', start: '2026-11-20', end: '2026-11-21', status: 'na' },
  { id: 's8', no: '8.0', name: 'Excavation and Backfill Site', start: '2026-11-21', end: '2026-11-24', status: 'not_started' },
  { id: 's9', no: '9.0', name: 'Rock Hammering and/or Blasting', start: '2026-11-24', end: '2026-11-24', status: 'not_started' },
  { id: 's10', no: '10.0', name: 'Plumbing or Septic System & Piping', start: '2026-11-25', end: '2026-11-25', status: 'not_started' },
  { id: 's11', no: '11.0', name: 'Crawlspace Foundation', start: '2026-11-26', end: '2026-11-26', status: 'not_started' },
  { id: 's12', no: '12.0', name: 'Sill Plate, Vapor Barrier and Insulation', start: '2026-11-27', end: '2026-11-27', status: 'not_started' },
  { id: 's13', no: '13.0', name: 'Dampproofing Foundation', start: '2026-11-27', end: '2026-11-28', status: 'not_started' },
  { id: 's14', no: '14.0', name: 'Plumbing or Well & Piping', start: '2026-11-28', end: '2026-12-01', status: 'not_started' },
  { id: 's15', no: '15.0', name: 'Electricity From Road to House', start: '2026-12-01', end: '2026-12-02', status: 'not_started' },
  { id: 's16', no: '16.0', name: 'Flatwork / Concrete Slabs', start: '2026-12-02', end: '2026-12-02', status: 'not_started' },
  { id: 'x-ship', no: '—', name: 'House ships from factory: balance due', start: '2026-12-02', end: '2026-12-02', status: 'not_started', suggested: true },
  { id: 'x-deliver', no: '—', name: 'House delivered to site', start: '2026-12-03', end: '2026-12-03', status: 'not_started', suggested: true },
  { id: 's17', no: '17.0', name: 'Crane Cost', start: '2026-12-03', end: '2026-12-03', status: 'not_started' },
  { id: 's18', no: '18.0', name: 'Modular Set Crew Cost', start: '2026-12-04', end: '2026-12-04', status: 'not_started' },
  { id: 's19', no: '19.0', name: 'Modular Exterior Finish', start: '2026-12-04', end: '2026-12-05', status: 'not_started' },
  { id: 's20', no: '20.0', name: 'Modular Interior Finish', start: '2026-12-05', end: '2026-12-08', status: 'not_started' },
  { id: 's21', no: '21.0', name: 'State Inspection', start: '2026-12-08', end: '2026-12-09', status: 'not_started' },
  { id: 's22', no: '22.0', name: 'Final Water & Sewer', start: '2026-12-09', end: '2026-12-09', status: 'not_started' },
  { id: 's23', no: '23.0', name: 'Solar System if applicable', start: '2026-12-10', end: '2026-12-10', status: 'na' },
  { id: 's24', no: '24.0', name: 'Finish Electrical', start: '2026-12-11', end: '2026-12-11', status: 'not_started' },
  { id: 's25', no: '25.0', name: 'Install Gutters', start: '2026-12-11', end: '2026-12-12', status: 'not_started' },
  { id: 'x-appl', no: '—', name: 'Appliances delivered & installed', start: '2026-12-12', end: '2026-12-12', status: 'not_started', suggested: true },
  { id: 's26', no: '26.0', name: 'Landscape', start: '2026-12-12', end: '2026-12-15', status: 'not_started' },
  { id: 's27', no: '27.0', name: 'Builders Risk Policy', start: '2026-12-15', end: '2026-12-16', status: 'not_started' },
  { id: 's28', no: '28.0', name: 'Other', start: '2026-12-16', end: '2026-12-16', status: 'na' },
  { id: 's29', no: '29.0', name: 'Other', start: '2026-12-17', end: '2026-12-17', status: 'na' },
  { id: 's30', no: '30.0', name: 'Other', start: '2026-12-18', end: '2026-12-18', status: 'na' },
  { id: 's31', no: '31.0', name: 'Start permits', start: '2026-12-19', end: '2026-12-19', status: 'not_started', assignee: 'Kevin Lockhart' },
  { id: 's31a', no: '31.01', name: 'Septic permit', start: '2026-12-19', end: '2026-12-19', status: 'not_started', assignee: 'Kevin Lockhart', parent: 's31' },
  { id: 's31b', no: '31.02', name: 'Driveway permit', start: '2026-12-19', end: '2026-12-19', status: 'not_started', assignee: 'Kevin Lockhart', parent: 's31' },
  { id: 's31c', no: '31.03', name: 'Building permit', start: '2026-12-19', end: '2026-12-19', status: 'not_started', assignee: 'Kevin Lockhart', parent: 's31' },
  { id: 'x-co', no: '—', name: 'Final walk-through & C of O', start: '2026-12-21', end: '2026-12-21', status: 'not_started', suggested: true },
]
