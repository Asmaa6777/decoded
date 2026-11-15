# Autopilot

Instructions and memory for the scheduled Claude Code runs that work on Decoded without a person watching. Each run starts in a fresh session with no memory of earlier runs, so **this file is the memory**. Read it first and update it last.

Owner: Ahmed Alghali ([a7med7x7](https://github.com/a7med7x7)). Edit this file to steer the runs: reorder the queues, add tasks, or change the rules below.

## Schedule

Times are Qatar time (UTC+3).

| Run | Time | Job |
| --- | --- | --- |
| A | 06:10 | **Exam work:** the next phase in the exam queue |
| B | 10:40 | **Exam work:** the next phase in the exam queue |
| C | 14:50 | **Quality work:** the top item in the quality queue |

If the job's queue is empty, take the top item in the other queue. If both are empty, log that and stop.

## Merge policy

- **2026-11-02 (day 1):** the run merges its own pull request once CI passes.
- **From 2026-11-03:** open the pull request and leave it for the owner to review and merge. Don't merge.
- **Exam phases stack.** If the previous phase's PR isn't merged yet, branch from its branch and open the new PR against it, saying so in the PR description, so the owner can review them in order.
- Never push straight to `main`. Never force-push a branch someone else has pushed to.

## Rules for every run

1. **One task per run.** Finish it, ship it, stop. Don't start a second task to fill time.
2. **Stop rule.** If the task is unclear, or tests still fail after two real attempts at a fix, stop. Commit any useful work to the branch, log what blocked you under "Blocked", and end the run.
3. **Follow the repo's own rules:** `CLAUDE.md`, `docs/writing-lessons.md`, `docs/building-a-course.md` and `docs/brand.md`.
4. **Before opening or updating a pull request:** `npm run lint` (0 errors), `npm run test` and `npm run build` all pass.
5. **Facts must be right.** Work every example again and run every code sample. No source material is provided, so write from standard textbooks and recognized curricula (ACM/IEEE CS2023) in your own words.
6. **GitHub:** `gh pr ...` and `gh issue ...` fail in these sessions (GraphQL is blocked). Use the REST API through `gh api`, for example:
   - open: `gh api repos/STACK-42/decoded/pulls -f title=... -f head=<branch> -f base=main -f body=... -F draft=true`
   - merge: `gh api -X PUT repos/STACK-42/decoded/pulls/<n>/merge -f merge_method=merge`
   - CI: `gh api repos/STACK-42/decoded/commits/<sha>/check-runs`
   If CI fails in the "Setup Bun" step with a 403, that's issue #37 (fixed by PR #51 once merged) and not your code. Re-run the job once.
7. **Branches:** `autopilot/exams-<phase-number>-<short-name>` for an exam phase, and `autopilot/<short-task-name>` for anything else.
8. **Finish by updating this file** on your branch: tick off what you did, add anything new you noticed to the quality queue, and add a line to the run log.

## Exam queue

The owner's priority since 2026-11-03: proper exam practice. The design, decisions and phases are in [`docs/exams.md`](exams.md); follow it, and update it if a phase teaches you something that changes the plan. One phase per run.

- [ ] 1. Question bank: move the 259 quiz questions into per-course `questions.ts`, quizzes read from it, no visible change.
- [ ] 2. Course exam page at `/courses/<course>/exam`.
- [ ] 3. Review queue (Leitner) at `/review`, with "N due" on the Dashboard.
- [ ] 4. Question banks for Operating Systems and Advanced Algorithms, then at least 4 questions per taught lesson everywhere.
- [ ] 5. Generated questions (subnets, scheduling, Big-O first).
- [ ] 6. Account sync for review cards and exam attempts.

## Parked

- **New courses** are on hold until the exam work is done.
- **Distributed Systems:** modules 1 and 2 (9 lessons) are complete on branch `autopilot/course-distributed-systems`; PR #49 is closed, not merged. The plan for modules 3 and 4 is in `docs/autopilot.md` on that branch. Reopen #49 to continue or to ship the two finished modules.

## Quality queue

Linking, broken visualizations, and rework of anything that isn't good enough. Top item first.

1. ~~**Issue #42, linking: Algorithm Design and Analysis ↔ Advanced Algorithms.** Five topics are taught in both with zero links between them. Link each pair both ways (pairs are listed in the issue).~~ Done before this queue was written; checked 2026-11-02: both directions linked, and every non-quiz lesson in these courses has links.
2. ~~**Issue #42, linking: Operating Systems ↔ Computer Architecture and Computer Organization** (virtual memory, paging, memory hierarchy).~~ Done before this queue was written; checked 2026-11-02: both directions linked, and every non-quiz lesson in these courses has links.
3. ~~**Issue #42, linking: Theory of Computation.** Zero links out across 14 lessons.~~ Done before this queue was written; checked 2026-11-02: 65 links out, in every lesson except the two quizzes.
4. ~~**Issue #42, linking: Operating Systems.** Zero links out across 17 lessons.~~ Done before this queue was written; checked 2026-11-02: 72 links out, in all 17 lessons.
5. ~~**Issue #38:** README course table.~~ Done 2026-11-02 (run C): Operating Systems row added, Advanced Algorithms count fixed (24, not 25); every other row matches `registry.ts`.
6. ~~**Visualizer audit.**~~ Done 2026-11-03 (run C, PR #54). All 238 lessons at 390 px, every Step button pressed to the end and every toggle tried: **0 crashes, 0 page errors, 0 pages wider than the screen.** 166 places scroll sideways inside a visualizer: 110 are code panels (fine, like any code block) and 56 are pictures or tables. Fixed the worst: Theory of Computation's automaton diagrams (up to 416 px too wide) now fit, with stacked labels. The rest are items 9 to 12.
7. ~~**Issue #37:** pin the Bun version.~~ PR #51 (pinned to 1.4.4), waiting for review.
8. **Issue #42, the rest:** Advanced Algorithms, Algorithm Design and Analysis, Computer Literacy, The Exam Mind, then the generic-preview fixes (bold definitions) in the courses marked "previews only".
9. **Array visualizers are too wide on phones** (up to 284 px): linear and binary search (Algorithm Design, Advanced Algorithms ×3, Discrete Mathematics loop invariants), skip lists, min-max in 1.5n − 2 comparisons. Probably one shared array component; make its cells shrink or wrap.
10. **Cryptography diagrams are too wide** (up to 260 px): Computational Mathematics `affine-ciphers` "Affine map", `what-is-cryptography` "A secret-key system", `stream-ciphers` "A stream cipher, bit by bit".
11. **Wide tables in visualizers** (up to 180 px): "Recursion tree & master method" (4 Advanced Algorithms lessons), "CPU scheduler" (2 Operating Systems lessons), "Hash functions side by side". A table scrolling is acceptable; check whether columns can be narrower first.
12. **Smaller overflows** (under 140 px): Theory of Computation automaton pages' step-through machines in `states-symbols-and-transitions` and `nfa` (136 px, a different component from the one fixed), birthday problem, union-find, bits-and-bytes, activity selection, process switch and multilevel feedback queue (Operating Systems), merge sort levels.

## Blocked

Nothing yet.

## Run log

Newest first. One line per run: date and run, what was done, PR link, merged or open.

- 2026-11-14 14:50 (run C): from the 2026-11-12 audit, the Computational Mathematics `averaging-is-convolution` "Sliding the kernel" stepper (208 px too wide at 390 px) now fits: on phones the row names sit above the cells and the 7 cells are 36 px wide, so the kernel and outputs stay aligned under the window. Desktop unchanged. PR #81, open. Exam runs A and B on 2026-11-14 found nothing changed and logged nothing.
- 2026-11-13 14:50 (run C): from the 2026-11-12 audit, the Logic Design `logic-gates` propagation-delay table (222 px too wide at 390 px) now fits: short headers on phones, the edge name left to the arrow and colour there, and the stage delay shown under its parameter instead of in its own column. Desktop keeps all six columns, and its transition pills no longer wrap. Stacked on #79 (same lines). PR #80, open. Exam runs A and B on 2026-11-13 found nothing changed and logged nothing.
- 2026-11-12 14:50 (run C): started on the Computer Architecture diagram overflows from the 2026-11-12 audit, but found a visible bug first and fixed that instead: 28 `\uXXXX` escapes in `LogicVisualizers.tsx`, 13 of them in JSX text where React prints them literally, so 5 Logic Design lessons (`logic-gates`, `boolean-algebra`, `sop-and-pos`, `karnaugh-maps`, `universal-gates`) showed "0 \u2192 1" and "\u2211 m(3, 4)" instead of → and ∑. All replaced by the real characters; a new test fails on any `\u` escape in `src/components`. PR #79, open. The circuit SVGs (shift register, counters, schematics) stay on the audit list: at 390 px they would need a phone layout, not just a smaller minimum width, since their text drops below 6 px when scaled.
- 2026-11-12 (run C of 2026-11-11, delivered late; run A of 2026-11-12 logged on the exam branch): re-audited all 248 lessons at 390 px against current main. Fixed the worst overflow no open PR covers: the hash-table slots in Advanced Algorithms `collision-resolution` and `lab-hashing` (up to 472 px too wide) now wrap into even rows of at most 6 on phones, and fit one row on desktop (were 158 px too wide there too). PR #78, open.
  Still overflowing on main and not covered by an open PR (390 px, px too wide): computer-architecture `registers-and-shift-registers` and `ripple-and-synchronous-counters` SVGs (284), `demystifying-circuit-schematics` (204); logic-design `logic-gates` truth table (222), `memory-unit` (105), `codes-and-floating-point` (65); computational-mathematics `averaging-is-convolution` (208), `caesar-and-shift-ciphers` (180), `order-and-primitive-roots` (66), `modular-inverses` (44); operating-systems `processes` (144), multilevel feedback queue in `round-robin-and-beyond` (120); computer-organization `bits-and-bytes` (124); discrete-mathematics `birthday-problem` (120); data-structures `union-find` (110); advanced-algorithms `order-statistics` (67), `lab-bit-manipulation` (64), `analysis-of-algorithms` / `divide-and-conquer` merge levels (69). Covered by open PRs: automata (#54), arrays (#64), skip list and invariant (#69), ciphers (#73), tables (#76).
- 2026-11-07 14:50 (run C): quality item 10 (from #54), the three cryptography visualizers now fit 390 px: secret-key flow redrawn 480 units wide (was 660 with a 520 px minimum), stream-cipher bits grouped by byte and wrapping, affine map without its 560 px minimum on phones and with larger letters there. Noted: main's Computational Mathematics rounds changed the Polynomials quiz (8dcfbf2), one more quiz edit the exam stack must absorb at its next rebase. PR #73, open.
- 2026-11-03 14:50 (run C): visualizer audit (item 6). No crashes or page overflow anywhere; fixed Theory of Computation automaton diagrams on phones (fit to width, labels stacked and outlined, drawn above states); logged items 9-12. PR #54, open.
- 2026-11-11 (catch-up): the session was down 2026-11-08 to 2026-11-10, and 10 queued runs fired together on 2026-11-11. Did one task, not three: quality item 11 (from #54), the recursion-tree / master-method, CPU scheduler and hash-function tables fit 390 px (were 160-180 px too wide, hiding the turnaround, waiting and level-cost columns): no table minimum width on phones, short CPU headers there, narrower inputs, the Gantt chart's minimum lowered to 280 px with its end label kept clear. The 7 exam runs (A/B) stayed blocked on the owner's A/B/C choice for #68's practice questions; nothing new stacked. PR #76, open.
- 2026-11-03 (owner request): new direction. Distributed Systems parked (#49 closed, branch kept; M2 had been added by run A that morning). Bun pinned (#51, open). Exam plan written in `docs/exams.md` and queued here (#52, open). Runs A and B switched from course work to exam work.
- 2026-11-02 14:50 (run C): quality items 1-4 were already done on main (issue #42's checklist is stale), so took item 5: README course table (#38). PR #50, merged.
- 2026-11-02 01:10 (setup): wrote this file. Baseline: 2,104 tests pass, lint 0 errors, CI green on `main` (82faa87).
