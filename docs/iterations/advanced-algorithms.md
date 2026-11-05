# Advanced Algorithms & Analysis: iteration rounds

Tracks the Advanced Algorithms & Analysis course through the rounds in [Build in iterations](../building-a-course.md#build-in-iterations). Each round is committed on its own, ticks its box here, and adds its report below.

Modules: **M0** Foundations of Analysis · **M1** Divide and Conquer · **M2** Hashing and Search Trees · **M3** Design Strategies · **M4** P and NP

- [x] 1. Skeleton (whole course)
- [ ] 2. Source fidelity
  - [x] M0
  - [ ] M1
  - [ ] M2
  - [ ] M3
  - [ ] M4
- [ ] 3. Depth
  - [ ] M0
  - [ ] M1
  - [ ] M2
  - [ ] M3
  - [ ] M4
- [ ] 4. Plain language
  - [ ] M0
  - [ ] M1
  - [ ] M2
  - [ ] M3
  - [ ] M4
- [ ] 5. Visualizations
  - [ ] M0
  - [ ] M1
  - [ ] M2
  - [ ] M3
  - [ ] M4
- [ ] 6. Practice
  - [ ] M0
  - [ ] M1
  - [ ] M2
  - [ ] M3
  - [ ] M4
- [ ] 7. Connections (whole course)
- [ ] 8. Student read-through
  - [ ] M0
  - [ ] M1
  - [ ] M2
  - [ ] M3
  - [ ] M4
- [ ] 9. Real readers (whole course)

**Done before this checklist, informally (not to the round's full bar):** the course was linked to Algorithm Design and Analysis, Discrete Mathematics and Logic Design (round 7, partly).

## Reports

Newest last.

### Round 2, source fidelity: M0 Foundations

Commit 08c1597. Checked lectures 1 to 3 and labs 1 to 3 against lessons m0-01 to m0-06.

**Already covered:** insertion sort and its cases, merge and the recursion tree, the five small algorithms and their every-case counts, worst/average/best for sequential search, the Fibonacci call counts and timing table, "applying the theory", order and Θ; the maths revision and three proof templates, algorithm criteria, problem vs. instance, the term-contribution experiments, O/Ω/Θ with the notes' examples and rules; all four recurrence methods and all five master-method examples; every bit operator, rotation, exercise and binary-file function; FastPower, both sorts' recurrences, the extra problems and the min-max task.

**Changed:**
- m0-06: the growth-rate problem lists n^(log n), not n log n, so the lesson's answer was wrong. Fixed, with the reason for each step and a callout on the slip. Added Algorithm 2's min-max trace on the lab's 16 numbers (22 comparisons = 1.5n − 2, checked in Python). Said why Algorithm 1's two scans are n/2 − 1.
- m0-01: the row-by-row insertion sort trace on 8 2 4 9 3 6; relative vs. absolute speed.
- m0-02: the full average case when the key may be missing, p(n+1)/2 + n(1 − p) (the old line left out the factor p), checked at p = 0, ½, 1.
- m0-03: a table for the `add` example's count (2n + 2 by assignments; the notes' 2n + 3; 2n if `+` is the operation); the F₀ = 1 vs F₀ = 0 numbering; 2ⁿ at 1000 and 10000 is 10³⁰¹ and 10³⁰¹⁰.
- m0-05: a callout listing the lab code's slips.

**Source errors:**
- Lab 3: the min-max sheet's last row restarts from a stale row; Algorithm 1 rounds n/2 − 1 up to n/2.
- Lab 1: right shift "appends 0 at the end" (it fills on the left); `rightRotate`/`leftRotate` have an extra `(` and use signed `int`; `count_one` never initialises `count`; `check(int N)` uses an undeclared `i`; `fopen("junk", "w")` is text mode.
- Lecture 1: `for (i=1; j<=n; j++)` in `matrixmult`; `j=i+l` in exchange sort.
- Lecture 2: Experiment 2's percentages are slightly off (92.34% at n = 100; correct is 92.51%); 2¹⁰⁰⁰ is given as 10³⁰⁰.

**Found but not fixed:** the binary-search substitution proof needs n₀ = 2, since lg 1 = 0 (round 3).

**Not checked:** no browser check; no visualizers changed.
