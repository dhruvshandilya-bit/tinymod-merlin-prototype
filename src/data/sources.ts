/** Every file a number in this prototype came from. Chips show `short + cell`; the drawer shows the rest. */
export type SourceKey = 'PM' | 'DRAW' | 'BLUE' | 'BLUEM' | 'OF7' | 'TPL' | 'SCHED' | 'C0730' | 'C1001' | 'C1010' | 'CODE' | 'ASSUMED'

export interface Source {
  short: string
  title: string
  file: string
  tab?: string
  what: string
  tone: 'sheet' | 'merlin' | 'call' | 'assumed'
}

export const SOURCES: Record<SourceKey, Source> = {
  PM: {
    short: 'PM sheet', tone: 'sheet',
    title: 'TMOD Project Management & Cost Model (this job)',
    file: 'TMOD Project Management & Cost Model_[homeowner] Residence.xlsx', tab: 'Project Management',
    what: 'The customer-facing costing sheet: project steps in order, bid total, paid, contractor, notes. Column E = bid total.',
  },
  DRAW: {
    short: 'Draw sheet', tone: 'sheet',
    title: 'Draw & Budget Master: the homeowner\'s construction loan',
    file: 'Draw & Budget Master.xlsx', tab: 'Original Budget',
    what: 'The bank\'s draw sheet: lender amount per line (column C), draws 1–3 (columns E–G), 25 / 65 / 10 split (row 5), $443,000 loan (C40).',
  },
  BLUE: {
    short: 'Blue Sheet', tone: 'sheet',
    title: 'BLUE SHEET MASTER (this job\'s values)',
    file: 'BLUE SHEET MASTER.xlsx', tab: 'TINYMOD',
    what: 'TinyMod\'s internal margin sheet for this job: TM wholesale (G29), services (K28–K29), sales tax (K34), margin % (L46).',
  },
  BLUEM: {
    short: 'Blue master', tone: 'sheet',
    title: 'BLUE SHEET MASTER: PROFIT MARGINS (template)',
    file: 'BLUE SHEET MASTER - PROFIT MARGINS.xlsx', tab: 'TINYMOD',
    what: 'The current template. It adds the Merlin AI line (K30 = 1% × G29) and is the source of every Blue Sheet formula.',
  },
  OF7: {
    short: 'Order form #7', tone: 'sheet',
    title: 'TMOD Sales Order Form #7: omit appliance (22 May 2026)',
    file: 'TMOD ORDER FORM [HOMEOWNER] OMIT APPLIANCE 052626.xlsx', tab: 'TMOD',
    what: 'The customer estimate: SkyMod 780C, base price AB71, options AB72 (B-column + M-column picks), total AB77.',
  },
  TPL: {
    short: 'Merlin template', tone: 'merlin',
    title: 'TinyMod budget template already in Merlin',
    file: 'ether-server: resources/budget-templates/tinymod-budget-template.json (V384, commit c705f79917)',
    what: 'Seeds every converted TinyMod budget: line names, cost codes 1000–9000, hidden 9000 block, GC fee and Merlin AI rows.',
  },
  SCHED: {
    short: 'Merlin schedule', tone: 'merlin',
    title: 'This job\'s schedule in Merlin (project template uploaded 10 Oct)',
    file: 'Screenshots of the project Schedule tab', tab: 'Schedule',
    what: 'Task numbers, names, placeholder dates, status and assignee as they sit in Merlin today.',
  },
  C0730: {
    short: 'Call 30 Jul', tone: 'call',
    title: 'Merlin × TinyMod weekly call, 30 Jul 2026',
    file: 'july 30 .txt',
    what: 'Blue Sheet scope (keep TM wholesale, services, totals only), margin lives in the base price, PM sheet is the customer budget.',
  },
  C1001: {
    short: 'Call 1 Oct', tone: 'call',
    title: 'Merlin × TinyMod weekly call, 1 Oct 2026',
    file: 'oct 1.txt',
    what: 'Draw rules: 35% house deposit, construction 10 / 40 / 40 / 10, house balance in any draw, 1–8 draws, Excel export.',
  },
  C1010: {
    short: 'Call 10 Oct', tone: 'call',
    title: 'Merlin × TinyMod weekly call, 10 Oct 2026',
    file: 'oct 10 .txt',
    what: 'Project template is the same on every job; statuses not started / in progress / done / N/A; template applied to this job.',
  },
  CODE: {
    short: 'Merlin code', tone: 'merlin',
    title: 'Merlin repos (ether-server 3184279482, ether-web-v1 7a045c55ba)',
    file: 'ether-server, ether-web-v1',
    what: 'Where a screen or rule already exists in Merlin, or what would need building.',
  },
  ASSUMED: {
    short: 'Assumed', tone: 'assumed',
    title: 'Prototype assumption',
    file: 'No source: chosen for the prototype',
    what: 'Not in any sheet. Each one is tied to an open question.',
  },
}

export interface Ref { s: SourceKey; c?: string; note?: string }
export const r = (s: SourceKey, c?: string, note?: string): Ref => ({ s, c, note })
