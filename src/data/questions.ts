import { r, type Ref } from './sources'

export type Screen = 'estimate' | 'budget' | 'draws' | 'schedule'
export type Audience = 'TinyMod' | 'Merlin team'

export interface Question {
  id: string
  title: string
  why: string
  assumes: string
  screen: Screen
  audience: Audience
  refs: Ref[]
}

/** Open questions, in the order they block the build. Each one is marked where it bites in the prototype. */
export const QUESTIONS: Question[] = [
  {
    id: 'Q1', screen: 'estimate', audience: 'TinyMod',
    title: 'Which house price is final: $168,992, $169,987 or $175,091.76?',
    why: 'Three sheets give three numbers for the same house. The 35% deposit, the draw 2 balance and TinyMod\'s margin all come from it, and Eric said the Blue Sheet retail must equal the order form.',
    assumes: 'Budget uses the bank-approved $168,992. The estimate shows Order Form #7 ($169,987). The Blue Sheet check compares against the estimate.',
    refs: [r('DRAW', 'C8', '$168,992 purchase agreement'), r('OF7', 'AB77', '$169,987 total'), r('BLUE', 'K48', '$175,091.76 retail'), r('C0730', '40:23', '"retail sales total will match the order form"')],
  },
  {
    id: 'Q2', screen: 'budget', audience: 'TinyMod',
    title: 'Is transport part of the house line or its own line?',
    why: 'Merlin\'s template has "Modular Unit Total (base + options + transport)" under 2000 AND "MOD Transportation Allowance" under 6000. Filling both counts $8,560 twice and puts it in the GC fee base.',
    assumes: '2000 holds house & options only ($168,992); transport sits in 6000 ($8,560), as on the bank sheet.',
    refs: [r('TPL', '2000 / 6000'), r('DRAW', 'C8, C10'), r('PM', 'E15', '$177,552 incl. transport')],
  },
  {
    id: 'Q3', screen: 'budget', audience: 'TinyMod',
    title: 'GC fee: what rate, and which lines is it charged on?',
    why: 'The sheet\'s label says 15% but its formula uses 10%, on permits + site work + delivery + connections + appliances, not on transport. Merlin\'s fee row can only take whole cost codes: 10% of 3000–7000 is $21,756, which is $499.50 more than the $21,256.50 the bank approved.',
    assumes: '10%, charged on the exact lines the sheet\'s formula used (tick list), so it lands on $21,256.50.',
    refs: [r('PM', 'E18', '=SUM(E21,E25:E46,E48:E60)*10%'), r('PM', 'H18', 'label "15% Of All Site Work"'), r('TPL', 'GC_FEE', '15% of 3000–7000'), r('DRAW', 'C9')],
  },
  {
    id: 'Q4', screen: 'draws', audience: 'TinyMod',
    title: 'Who is the draw invoice addressed to: the bank, or the homeowner "financed by" the bank?',
    why: 'Funding a draw raises an invoice. In Merlin a bank is normally a supplier, not a customer, and the budget\'s Drawn column only fills when that invoice is paid.',
    assumes: 'Invoice to the lender as a customer account.',
    refs: [r('CODE', 'ReceivableInvoiceService / Receivable.financeVendorId')],
  },
  {
    id: 'Q5', screen: 'draws', audience: 'Merlin team',
    title: 'Track draws per line, or per cost code?',
    why: 'The bank sheet is per line (rock blasting, well…). Merlin\'s Drawn column adds up per cost code, and budget lines have no stable id yet, so per-line draws need a small server change.',
    assumes: 'Per line, held in the draw schedule; the budget\'s Drawn column shows the cost-code roll-up.',
    refs: [r('DRAW', 'B7:B34'), r('CODE', 'BudgetLineItemEmbedded has no id')],
  },
  {
    id: 'Q6', screen: 'draws', audience: 'TinyMod',
    title: 'Rock blasting and dampproofing were drawn twice. Was that a mistake or a real overrun?',
    why: 'Both were in draw 1 and draw 2, $20,650 over what the bank approved. A mistake means the bank was over-drawn. An overrun should come out of contingency, which would leave $4,476.50.',
    assumes: 'Mistake. Each is drawn once, in the draw its Draw Request put it in.',
    refs: [r('DRAW', 'E18 & F18'), r('DRAW', 'E22 & F22'), r('DRAW', 'D18, D22', 'Draw Request had rock in draw 1, dampproofing nowhere')],
  },
  {
    id: 'Q7', screen: 'draws', audience: 'TinyMod',
    title: 'Draw 3 is $4,328.25 over the bank\'s 10%. Is that OK?',
    why: 'Everything after the house is set adds up to $48,628.25 against a $44,300 cap. A bank may refuse a draw above its share, so lines would have to move earlier.',
    assumes: 'Warn only, as agreed. Lines stay where they are.',
    refs: [r('DRAW', 'G1', '$44,300'), r('DRAW', 'G5', '10%')],
  },
  {
    id: 'Q8', screen: 'draws', audience: 'TinyMod',
    title: 'Which schedule step releases each draw for this bank?',
    why: 'Draws are entered by hand, but naming the step lets Merlin say "draw 2 is ready to request" when the house ships.',
    assumes: 'Draw 1: loan closes · Draw 2: house ships · Draw 3: C of O.',
    refs: [r('C1001', '46:21', 'house balance can come in any draw'), r('ASSUMED')],
  },
  {
    id: 'Q9', screen: 'budget', audience: 'TinyMod',
    title: 'Is the $3,500 feasibility fee in the loan?',
    why: 'Merlin\'s template lists it as a normal 1000 line. It\'s invoiced before the loan and isn\'t in the $443,000. Counting it would make the budget $3,500 more than the loan.',
    assumes: 'Shown on the budget, marked "not in loan", never drawn.',
    refs: [r('PM', 'E8'), r('TPL', '1000 Feasibility & Custom Design'), r('C0730', '9:26', 'feasibility is just an invoice')],
  },
  {
    id: 'Q10', screen: 'budget', audience: 'TinyMod',
    title: 'Is contingency always "loan minus everything else"?',
    why: 'On the sheet it\'s typed as $25,126.50, which is exactly the gap to the loan. If it\'s meant to be a % instead, the budget won\'t equal the loan.',
    assumes: 'Worked out as loan − every other line, so the budget always ties to the loan.',
    refs: [r('DRAW', 'C34'), r('DRAW', 'C40')],
  },
  {
    id: 'Q11', screen: 'estimate', audience: 'TinyMod',
    title: 'this job\'s services are VIZ $20,000 + MBi $20,000. Are those right?',
    why: 'The master has $15,000 each and Daughtrey had $5,000 each. Services sit in the subtotal the margin is charged on, so they move retail and TinyMod\'s net.',
    assumes: 'this job\'s sheet as sent: $20,000 + $20,000.',
    refs: [r('BLUE', 'K28, K29'), r('BLUEM', 'K28, K29', '$15,000 each'), r('C0730', '40:41', '"that 15 could change to 25"')],
  },
  {
    id: 'Q12', screen: 'estimate', audience: 'TinyMod',
    title: 'Should this job carry the Merlin AI line (1% of TM)?',
    why: 'The master template has it, but this job\'s Blue Sheet came before it. Adding it (1% of $109,857.55 = $1,098.58, plus margin on it) moves retail by $1,266.66.',
    assumes: 'Shown at 0% to match this job\'s sheet.',
    refs: [r('BLUEM', 'K30', '=L30*G29'), r('BLUE', 'no K30 row')],
  },
  {
    id: 'Q13', screen: 'estimate', audience: 'TinyMod',
    title: 'Is the margin really meant to include sales tax and services?',
    why: 'The formula takes margin % × subtotal, and the subtotal includes sales tax and services. So TinyMod also earns margin on the tax.',
    assumes: 'Formula as the master has it.',
    refs: [r('BLUEM', 'K46', '=L46*K44'), r('BLUEM', 'K44', '=SUM(K34:K43)')],
  },
  {
    id: 'Q14', screen: 'estimate', audience: 'TinyMod',
    title: 'Is the one-off a % of the margin or of the subtotal?',
    why: 'The formula multiplies the margin, but on 30 Jul Eric described it as "adding an additional margin". It\'s 0% today, so this only matters on the first one-off job.',
    assumes: '% of the margin, as the formula has it.',
    refs: [r('BLUEM', 'K47', '=K46*L47'), r('C0730', '42:33')],
  },
  {
    id: 'Q15', screen: 'estimate', audience: 'TinyMod',
    title: 'Does the $3,000 frame credit apply without a Uni-Frame?',
    why: 'Order Form #7 doesn\'t tick Uni-Frame, but the Blue Sheet still adds the $3,000 to TinyMod\'s net. If it only applies with a frame, the net is overstated.',
    assumes: 'Counted, as on the sheet.',
    refs: [r('BLUE', 'K49'), r('OF7', 'E45', 'Uni-Frame not ticked')],
  },
  {
    id: 'Q16', screen: 'schedule', audience: 'TinyMod',
    title: 'Add the house and draw steps to the project template?',
    why: 'The template has no step for releasing the house, loan closing, the house shipping, delivery or C of O, so the house money and the draws have nothing to attach to.',
    assumes: 'Six suggested steps, marked "Suggested".',
    refs: [r('SCHED'), r('PM', 'B16, B47, B62', 'release, balance due, C of O are steps on the PM sheet')],
  },
  {
    id: 'Q17', screen: 'budget', audience: 'Merlin team',
    title: 'Keep the hidden 9000 block out of the contract total',
    why: 'The template seeds 9000 (wholesale, margin…) as hidden lines, but it doesn\'t mark them "not in contract". Once they hold money, wholesale + services + margin ($173,091.76 on this job) would add to the contract value.',
    assumes: '9000 shown as hidden and not in contract.',
    refs: [r('TPL', '9000'), r('CODE', 'BudgetTemplateSeedService never sets includedInContract=false')],
  },
  {
    id: 'Q18', screen: 'estimate', audience: 'Merlin team',
    title: 'Merlin AI basis: retail or wholesale?',
    why: 'The template takes 1% of cost code 2000, the retail house ($1,689.92). The master takes 1% of TM wholesale ($1,098.58).',
    assumes: 'Wholesale, as the master has it.',
    refs: [r('TPL', 'MERLIN_AI'), r('BLUEM', 'K30')],
  },
  {
    id: 'Q19', screen: 'estimate', audience: 'Merlin team',
    title: 'Check that internal estimate rows don\'t print on the customer PDF',
    why: 'TinyMod prints prices on the customer copy, and both copies use the estimator\'s display settings. Dealer assistance and sales allowance could show to the homeowner. Not tested.',
    assumes: 'Nothing; needs a test on a TinyMod estimate.',
    refs: [r('CODE', 'V383 PDF_PRICING_ON_CUSTOMER_COPY, V313 estimator-only rows')],
  },
]
