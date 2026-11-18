import { r, type Ref } from './sources'

export type Screen = 'estimate' | 'budget' | 'draws' | 'schedule'
export type Audience = 'TinyMod' | 'Merlin team'
/** open = still to ask · partly = answered in part, the rest still open · answered = settled (by TinyMod, or by Merlin when TinyMod left it to us) */
export type QStatus = 'open' | 'partly' | 'answered'

export interface Question {
  id: string
  title: string
  why: string
  assumes: string
  screen: Screen
  audience: Audience
  refs: Ref[]
  status: QStatus
  /** The answer as given, and what it changed in the prototype. */
  answer?: string
  answeredBy?: 'TinyMod' | 'Merlin'
}

/** Every money figure quoted below is recomputed in budget.test.ts. */
export const QUESTIONS: Question[] = [
  {
    id: 'Q1', screen: 'estimate', audience: 'TinyMod', status: 'answered', answeredBy: 'TinyMod',
    title: 'Which house price is final?',
    answer: 'The estimate total is always final. Here that means the budget\'s house line is $169,987 (not the bank sheet\'s earlier $168,992), contingency absorbs the $995, and the Blue Sheet margin is whatever is left of the estimate.',
    why: 'Three sheets gave three numbers for the same house. The deposit, the draw 2 balance and TinyMod\'s margin all come from it.',
    assumes: 'Estimate total ($169,987) everywhere.',
    refs: [r('OF7', 'AB77', '$169,987 estimate total'), r('DRAW', 'C8', '$168,992 on the bank sheet'), r('BLUE', 'K48', '$175,091.76 at the sheet\'s 15.3%')],
  },
  {
    id: 'Q2', screen: 'budget', audience: 'TinyMod', status: 'answered', answeredBy: 'Merlin',
    title: 'Is transport part of the house line or its own line?',
    answer: 'Left to Merlin. Transport is counted once: as its own 6000 line (as on the bank sheet, where the customer sees it), and the 2000 line takes the estimate total. Only if the estimate\'s Transportation row has an amount does transport stay in 2000, with 6000 at $0. To do: reword the template\'s 2000 line, which says "(base + options + transport)".',
    why: 'Merlin\'s template has transport inside the 2000 line and again under 6000. Filling both counts $8,560 twice.',
    assumes: 'Transport in 6000; 2000 = estimate total.',
    refs: [r('TPL', '2000 / 6000'), r('DRAW', 'C10'), r('OF7', 'AB74', 'Transportation row blank on this estimate')],
  },
  {
    id: 'Q3', screen: 'budget', audience: 'TinyMod', status: 'partly', answeredBy: 'TinyMod',
    title: 'GC fee: which lines is it charged on?',
    answer: 'The rate is set per job, on the estimate, and carries to the budget. Still open: which lines it\'s charged on.',
    why: 'The sheet\'s formula charges it on permits, site work, delivery, connections and appliances, but not transport. Merlin\'s fee row can only take whole cost codes: 10% of codes 3000–7000 is $21,756, which is $499.50 more than the $21,256.50 the bank approved.',
    assumes: 'The exact lines in the sheet\'s formula (tick list).',
    refs: [r('PM', 'E18', '=SUM(E21,E25:E46,E48:E60)*10%'), r('PM', 'H18', 'label says 15%'), r('TPL', 'GC_FEE', '15% of 3000–7000'), r('DRAW', 'C9')],
  },
  {
    id: 'Q4', screen: 'draws', audience: 'TinyMod', status: 'answered', answeredBy: 'TinyMod',
    title: 'Who is the draw invoice addressed to?',
    answer: 'Mostly the customer. Draw invoices go to the customer by default, and you can switch a job to the lender.',
    why: 'Funding a draw raises an invoice, and the budget\'s Drawn column only fills once that invoice is paid.',
    assumes: 'Customer.',
    refs: [r('CODE', 'ReceivableInvoiceService')],
  },
  {
    id: 'Q5', screen: 'draws', audience: 'Merlin team', status: 'answered', answeredBy: 'TinyMod',
    title: 'Draw by line, or by cost code?',
    answer: 'Both. The Draws tab switches between Lines and Cost codes. For Merlin: per-line draws need a stable id on each budget line.',
    why: 'The bank sheet is per line, but Merlin\'s Drawn column adds up per cost code.',
    assumes: 'Both views.',
    refs: [r('DRAW', 'B7:B34'), r('CODE', 'BudgetLineItemEmbedded has no id')],
  },
  {
    id: 'Q6', screen: 'draws', audience: 'TinyMod', status: 'open',
    title: 'Rock blasting and dampproofing were drawn twice. Mistake or real overrun?',
    why: 'Both were in draw 1 and draw 2, $20,650 over what the bank approved. A mistake means the bank was over-drawn. An overrun should come out of contingency, which would leave $3,481.50.',
    assumes: 'Mistake. Each is drawn once, where its Draw Request put it.',
    refs: [r('DRAW', 'E18 & F18'), r('DRAW', 'E22 & F22'), r('DRAW', 'D18, D22', 'Draw Request: rock in draw 1, dampproofing nowhere')],
  },
  {
    id: 'Q7', screen: 'draws', audience: 'TinyMod', status: 'open',
    title: 'Draw 3 is $4,328.25 over the bank\'s 10%. Is that OK?',
    why: 'Everything after the house is set adds up to $48,628.25 against a $44,300 cap. A bank may refuse a draw above its share, so lines would have to move earlier.',
    assumes: 'Warn only. Lines stay where they are.',
    refs: [r('DRAW', 'G1', '$44,300'), r('DRAW', 'G5', '10%')],
  },
  {
    id: 'Q8', screen: 'draws', audience: 'TinyMod', status: 'open',
    title: 'Which schedule step releases each draw for this bank?',
    why: 'Draws are released by hand, but naming the step lets Merlin say "draw 2 is ready" when the house ships.',
    assumes: 'Draw 1: loan closes · Draw 2: house ships · Draw 3: C of O.',
    refs: [r('C1001', '46:21', 'the house balance can come in any draw'), r('ASSUMED')],
  },
  {
    id: 'Q9', screen: 'budget', audience: 'TinyMod', status: 'answered', answeredBy: 'TinyMod',
    title: 'Is the $3,500 feasibility fee in the loan?',
    answer: 'No. It\'s paid before the loan. It shows on the budget as "not in loan" and is never drawn.',
    why: 'Counting it would make the budget $3,500 more than the loan.',
    assumes: 'Not in the loan.',
    refs: [r('PM', 'E8'), r('C0730', '9:26', 'feasibility is just an invoice')],
  },
  {
    id: 'Q10', screen: 'budget', audience: 'TinyMod', status: 'open',
    title: 'Is contingency always "loan minus everything else"?',
    why: 'The sheet typed it as $25,126.50, the gap to the loan at the time. With the final estimate it becomes $24,131.50. If it\'s meant to be a %, the budget won\'t equal the loan.',
    assumes: 'Loan − every other line.',
    refs: [r('DRAW', 'C34'), r('DRAW', 'C40')],
  },
  {
    id: 'Q11', screen: 'estimate', audience: 'TinyMod', status: 'answered', answeredBy: 'TinyMod',
    title: 'Are the project services right?',
    answer: 'They change from job to job, so they\'re entered on each estimate. This job: VIZ $20,000 + MBi $20,000.',
    why: 'Services sit in the house price, so they move TinyMod\'s margin.',
    assumes: 'Per job.',
    refs: [r('BLUE', 'K28, K29'), r('BLUEM', 'K28, K29', '$15,000 each on the master')],
  },
  {
    id: 'Q12', screen: 'estimate', audience: 'TinyMod', status: 'answered', answeredBy: 'TinyMod',
    title: 'Does every job carry the Merlin AI line?',
    answer: 'Yes, every job. It\'s on here at 1% ($1,098.58 on wholesale). What it\'s a % of is still Q18.',
    why: 'This job\'s Blue Sheet came before the line existed.',
    assumes: 'On, at 1%.',
    refs: [r('BLUEM', 'K30', '=L30*G29')],
  },
  {
    id: 'Q13', screen: 'estimate', audience: 'TinyMod', status: 'open',
    title: 'Should the margin % be reported on the subtotal or on the factory price?',
    why: 'The margin is now whatever is left of the estimate ($17,030.87), so this only changes how the % reads: 11.13% of the subtotal (which includes services and tax) or 15.50% of the factory price.',
    assumes: '% of the subtotal, as the master\'s formula has it.',
    refs: [r('BLUEM', 'K46', '=L46*K44'), r('BLUEM', 'K44', '=SUM(K34:K43)')],
  },
  {
    id: 'Q14', screen: 'estimate', audience: 'TinyMod', status: 'answered', answeredBy: 'TinyMod',
    title: 'What is the one-off project line for?',
    answer: 'Skip it. Removed from the Blue Sheet. For Merlin: drop "One-Off Project" from the template\'s 9000 block.',
    why: 'Its formula was a % of the margin, and it was 0% on every sheet.',
    assumes: 'Removed.',
    refs: [r('BLUEM', 'K47', '=K46*L47')],
  },
  {
    id: 'Q15', screen: 'estimate', audience: 'TinyMod', status: 'answered', answeredBy: 'TinyMod',
    title: 'Is the $3,000 frame credit automatic?',
    answer: 'No. It\'s entered per job and never applied automatically. This job\'s sheet had $3,000.',
    why: 'It adds to TinyMod\'s net, not to the price.',
    assumes: 'Typed per job.',
    refs: [r('BLUE', 'K49'), r('OF7', 'E45', 'Uni-Frame not ticked on this estimate')],
  },
  {
    id: 'Q16', screen: 'schedule', audience: 'TinyMod', status: 'open',
    title: 'Add the house and draw steps to the project template?',
    why: 'The template has no step for releasing the house, loan closing, the house shipping, delivery or C of O, so the house money and the draws have nothing to attach to.',
    assumes: 'Six suggested steps, marked "Suggested".',
    refs: [r('SCHED'), r('PM', 'B16, B47, B62', 'release, balance due and C of O are steps on the PM sheet')],
  },
  {
    id: 'Q17', screen: 'budget', audience: 'Merlin team', status: 'answered', answeredBy: 'TinyMod',
    title: 'What is the hidden 9000 block?',
    answer: 'It isn\'t a cost. It\'s TinyMod working out who gets what from the house price. On the budget it shows as the split of the house line (factory, services, Merlin, tax, TinyMod margin), adding up to the estimate total. For Merlin: the template must keep it out of the contract total.',
    why: 'The template seeds those lines as hidden, but it doesn\'t mark them "not in contract", so they would add to the contract value.',
    assumes: 'A split of the house price, not in the contract.',
    refs: [r('TPL', '9000'), r('CODE', 'BudgetTemplateSeedService never sets includedInContract=false')],
  },
  {
    id: 'Q18', screen: 'estimate', audience: 'TinyMod', status: 'open',
    title: 'Merlin AI 1%: of which amount?',
    why: 'The 1% could be of the factory (TM) price, the estimate total, the subtotal, the gross margin or TinyMod\'s commission, and with or without sales tax. On this job that ranges from $1,098.58 (factory) to $1,699.87 (estimate total). Merlin\'s template uses the house line; the master uses the factory price.',
    assumes: '1% of the factory (TM) price, as the master\'s formula has it.',
    refs: [r('BLUEM', 'K30', '=L30*G29'), r('TPL', 'MERLIN_AI')],
  },
  {
    id: 'Q19', screen: 'estimate', audience: 'Merlin team', status: 'open',
    title: 'Check that internal estimate rows don\'t print on the customer PDF',
    why: 'TinyMod prints prices on the customer copy, and both copies use the estimator\'s display settings. Dealer assistance and sales allowance could show to the homeowner. Not tested.',
    assumes: 'Nothing; needs a test on a TinyMod estimate.',
    refs: [r('CODE', 'V383 PDF_PRICING_ON_CUSTOMER_COPY, V313 estimator-only rows')],
  },
]

export const OPEN = QUESTIONS.filter(q => q.status !== 'answered')
