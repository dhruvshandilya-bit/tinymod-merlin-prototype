# TinyMod × Merlin: one budget, placed in Merlin's own screens

A clickable prototype for TinyMod (modular GC). It shows where their three money sheets and their project template would live inside Merlin's existing screens.

| Their sheet | Where it lives in Merlin | New? |
|---|---|---|
| Order form | Sales → Estimate (selections + totals) | Exists |
| Blue Sheet | Estimate → Cover Sheet panel, TinyMod version (no separate project tab; its numbers land in the budget's hidden 9000 block) | New section in an existing panel |
| Costing sheet (PM sheet) | Project → Budget, seeded from the TinyMod budget template (V384) | Exists; GC fee editor is new |
| Draw & Budget Master | Project → Budget → **Draws** tab | **The only new screen** |
| Project template | Project → Schedule | Exists; 6 suggested steps |

Data is one TinyMod GC job. The homeowner is renamed "Rowan Residence". Every amount is the source's own.

## Walkthrough
- **Step bar** across the top, in the order a job happens: 0 Overview → 1 Estimate & Blue Sheet → 2 Budget → 3 Draws → 4 Schedule.
- **Presenter notes** panel on the right for each step: where it lives in Merlin, what it replaces, what to say, what to click, "If they ask" answers, and the open questions to raise. The script is in `src/data/walkthrough.ts`.
- **Kept out of the way until needed:** source chips (off by default; "Show sources" turns them on), $0 template lines ("Show $0 template lines"), the draw setup ("Edit setup"), and the estimate option groups (click a group to expand it).

## Where the data came from, and the open questions
- **Source chips** (off by default): every number carries a chip such as "PM sheet E33" or "Draw sheet C17". Hover a chip for the file, tab, cell and note. Chip colours: green = client sheet, purple = Merlin template or code, blue = call transcript, amber = prototype assumption.
- **Where the data came from**: a panel listing each source file, what was taken from it, and which questions depend on it.
- **Open questions (19)**: each one has why it matters, what the prototype assumes until it's answered, its sources, and a "Show me" link. They can be filtered by who must answer (TinyMod or Merlin team). Red Q-markers on screen open the matching question.
- Registers: `src/data/sources.ts` and `src/data/questions.ts`. Every figure quoted in a question is checked by a test.

```
npm install
npm run dev      # http://localhost:5196
npm test         # 17 tests: sheet totals + every figure quoted in a question
npm run build
```

## Formulas (src/lib)
- `budget.ts`:
  - GC fee = rate × the ticked lines. The default is the sheet's own base: $212,565 × 10% = $21,256.50.
  - Contingency = loan − every other line.
  - House rule: deposit 35% of purchase agreement + transport, rounded to the dollar = $62,143.
  - Construction track, pin or custom split per line.
  - Drawn = money in funded draws.
  - Warnings for over-cap draws and overruns.
- `blue.ts`: the Blue Sheet master, formula for formula, plus `solveMargin`.
- `export.ts`: Excel exports in their layouts, with live formulas.

## Corrected import file
The template-aligned import CSV (kept outside this repo) uses the TinyMod template's exact line names and cost codes, because the importer matches lines by name.
- Loan lines total $421,743.50. With the $21,256.50 GC fee row, that is $443,000.
- 9000 is marked Show to Customer = false and Contract = false.
- Feasibility is marked Contract = false.
- Each line's Notes column carries its source cells and open questions.

Not committed, not deployed.
