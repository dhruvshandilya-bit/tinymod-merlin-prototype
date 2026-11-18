/**
 * Presenter notes for the call: what each screen replaces, what to say, what to click, and answers to the
 * questions TinyMod is likely to ask. Answers stick to what Merlin does today or what this prototype shows;
 * anything undecided points at an open question instead.
 */
export type StepKey = 'overview' | 'estimate' | 'budget' | 'draws' | 'schedule'

export interface Faq { q: string; a: string }
export interface WalkStep {
  key: StepKey
  n: number
  title: string
  short: string
  where: string
  replaces: string
  say: string[]
  click: string[]
  faq: Faq[]
  questions: string[]
}

export const WALK: WalkStep[] = [
  {
    key: 'overview', n: 0, title: 'Overview', short: 'Overview',
    where: 'The whole job, start to finish',
    replaces: 'Four spreadsheets plus the project template',
    say: [
      'Today one job lives in four sheets: the order form, the Blue Sheet, the PM costing sheet and the bank draw sheet. They share the same list of lines but are typed in separately.',
      'In Merlin it becomes one estimate and one budget. The Blue Sheet sits on the estimate, and the costing sheet and draws are the same budget seen two ways.',
      'Only the Draws tab is a new screen. Everything else is a screen Merlin already has.',
    ],
    click: ['Walk the four steps across the top, in the order a job happens.'],
    faq: [
      { q: 'Do we still need the Excel sheets?', a: 'No. Each screen exports the same sheet layout to Excel, with formulas, for anyone who still wants a file. The bank gets the draw sheet that way.' },
      { q: 'Is this live in Merlin today?', a: 'The estimate, budget template, schedule template and invoices are live. The Blue Sheet section, the GC fee editor and the Draws tab are what we build next. This prototype shows them with your real numbers.' },
      { q: 'Whose numbers are these?', a: 'One of your GC jobs (homeowner renamed). Every amount comes from your sheets; turn on "Show sources" to see the exact sheet and cell.' },
    ],
    questions: [],
  },
  {
    key: 'estimate', n: 1, title: 'Estimate & Blue Sheet', short: 'Estimate',
    where: 'Sales → Opportunity → Estimate (Blue Sheet in the Cover Sheet panel)',
    replaces: 'TMOD Order Form + Blue Sheet',
    say: [
      'This is the estimate you already build in Merlin: base model plus options. Options go through at the factory\'s price, and your margin is in the base.',
      'Underneath is your Blue Sheet. Only TinyMod sees it, and it never prints. Type the factory quote, your services and your margin %, and Merlin does the math you do today.',
      'It checks retail against the order form total. Today you change the margin until they match; here it\'s one click.',
      'When the customer signs, these numbers copy into the project budget, hidden from the customer.',
    ],
    click: [
      'Change the margin %: retail and TinyMod net update.',
      'Click "Set margin to match" to make retail equal the estimate.',
      '"+ Add" a service line, or switch one to "% of TM" (that\'s how the Merlin AI line works).',
    ],
    faq: [
      { q: 'Can the customer see the Blue Sheet?', a: 'No. It lives in the Cover Sheet panel, which is internal and never goes on the customer PDF.' },
      { q: 'What if our services change, e.g. 15 to 25?', a: 'Edit the amount. Each service is a line you can change, add or remove per job.' },
      { q: 'Why doesn\'t retail match on this job?', a: 'Your sheets have three house prices: $168,992 (bank), $169,987 (order form #7) and $175,091.76 (Blue Sheet). That\'s Q1, and we need you to tell us which is final.' },
      { q: 'Where do the site-work costs go?', a: 'Not here. As you said on 30 Jul, site work, crane, set and finish crews go on the budget the customer sees. The Blue Sheet is the house only.' },
      { q: 'Is there a tariff?', a: 'Yes. Tariff % is a field, charged on TM only, the same as your sheet. It\'s 0% on this job.' },
    ],
    questions: ['Q1', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15'],
  },
  {
    key: 'budget', n: 2, title: 'Budget (costing sheet)', short: 'Budget',
    where: 'Projects → the job → Budget tab',
    replaces: 'TMOD Project Management & Cost Model (the sheet the customer sees)',
    say: [
      'When the estimate is signed, Merlin creates the project and fills the budget from your template: the same steps as your sheet, cost codes 1000 to 8000.',
      'Each line shows the bid total (rough, then bid, then final), what the bank approved, what you\'ve paid, what\'s been drawn, and what\'s left.',
      'The GC fee is a % you set per job, and you choose which lines it\'s charged on.',
      'Contingency is whatever is left of the loan, so the budget always equals the loan. If a bid comes in high, you pay the difference from contingency instead of drawing the line twice.',
    ],
    click: [
      'Change Rock Hammering to $40,000: it flags $20,000 over. Click "Pay from contingency".',
      'Change the GC fee % at the top and watch the fee update.',
      'Click a Stage chip: Rough → Bid → Final.',
    ],
    faq: [
      { q: 'Can we add a line, like solar?', a: 'Yes, add a line under any cost code. The template already has $0 lines for things like central air and propane; "Show $0 template lines" reveals them.' },
      { q: 'Where does "Paid" come from?', a: 'From the bills you pay in Merlin, or QuickBooks once it\'s connected. In the prototype you can type it.' },
      { q: 'Who is the contractor on a line?', a: 'Send the line out for bids, the feature shown on 1 Oct. The supplier you accept goes on the line.' },
      { q: 'What does the customer see?', a: 'Every line except the hidden 9000 block, which holds your Blue Sheet numbers.' },
      { q: 'Why 10% and not 15% for the GC fee?', a: 'Your sheet\'s label says 15%, but its formula uses 10%, and 10% is what the bank approved. It\'s per job here; that\'s Q3.' },
    ],
    questions: ['Q2', 'Q3', 'Q9', 'Q10', 'Q17'],
  },
  {
    key: 'draws', n: 3, title: 'Draws (bank draw sheet)', short: 'Draws',
    where: 'Projects → the job → Budget → Draws tab (new)',
    replaces: 'Draw & Budget Master',
    say: [
      'Same lines as the budget. You set the bank\'s rules once: number of draws, each draw\'s %, the house deposit, and which draw each line goes in.',
      'Merlin shows what\'s in each draw against the bank\'s share, and warns when a draw is over.',
      'Request a draw, then mark it funded when the bank pays. Merlin raises the invoice and the budget\'s Drawn column updates.',
      'Export gives the bank the same sheet it gets today.',
    ],
    click: [
      'Move a line to another draw with "How it\'s drawn": the draw totals update.',
      'Open "Edit setup" and try the 35% house · 10/40/40/10 pattern from the 1 Oct call.',
      'Click Request, then Mark funded on Draw 2.',
      'Export to Excel.',
    ],
    faq: [
      { q: 'Every bank does it differently.', a: 'Setup is per job: 1 to 8 draws, any % per draw, and the bank\'s name.' },
      { q: 'Can the house balance come in any draw?', a: 'Yes. The house rule chooses the draw for the deposit and the draw for the balance.' },
      { q: 'Can one line be split across draws?', a: 'Yes. Use the construction track (a % per draw) or a custom split per line.' },
      { q: 'Can the bank see it live?', a: 'No, as discussed on 1 Oct. Export it to Excel and send it.' },
      { q: 'What if the bank funds less than we asked?', a: 'Not in the prototype yet. Partial funding is something to settle before we build.' },
      { q: 'Why does draw 3 show a warning?', a: 'Everything after the house is set adds up to $4,328.25 more than the bank\'s 10%. That\'s a warning, not a block (Q7).' },
    ],
    questions: ['Q4', 'Q5', 'Q6', 'Q7', 'Q8'],
  },
  {
    key: 'schedule', n: 4, title: 'Schedule', short: 'Schedule',
    where: 'Projects → the job → Schedule tab',
    replaces: 'Your project template (uploaded 10 Oct)',
    say: [
      'This is the template you uploaded on 10 Oct: the same steps on every job.',
      'Each step links to its budget line, which is how the budget shows the step\'s status.',
      'We suggest six extra steps (release house, loan closes, house ships, delivered, appliances, C of O) so the house money and the draws have a step to hang off.',
      'When the step a draw waits on is done, Merlin tells you that draw is ready to request.',
    ],
    click: ['Set "House ships from factory" to Done: the "Draw 2 is ready" banner appears. Click "Open draws".'],
    faq: [
      { q: 'Can subcontractors update their steps?', a: 'Yes, as described on 1 Oct: assign a step to a sub and they update its status in their own Merlin login. Subs must be switched on as assignees first (10 Oct).' },
      { q: 'The dates are wrong.', a: 'They\'re the placeholder dates from the upload. You can set durations and dependencies so dates fill in automatically (10 Oct).' },
      { q: 'Do we have to use the suggested steps?', a: 'No. They\'re a proposal (Q16). Without them, a draw is still released by hand.' },
    ],
    questions: ['Q16', 'Q8'],
  },
]
