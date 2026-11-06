# Advanced Algorithms & Analysis: iteration rounds

Tracked on GitHub as [STACK-42/decoded#65](https://github.com/STACK-42/decoded/issues/65). Tracks the Advanced Algorithms & Analysis course through the rounds in [Build in iterations](../building-a-course.md#build-in-iterations). Each round is committed on its own, ticks its box here, and adds its report below.

Modules: **M0** Foundations of Analysis · **M1** Divide and Conquer · **M2** Hashing and Search Trees · **M3** Design Strategies · **M4** P and NP

- [x] 1. Skeleton (whole course)
- [x] 2. Source fidelity
  - [x] M0
  - [x] M1
  - [x] M2
  - [x] M3
  - [x] M4
- [x] 3. Depth
  - [x] M0
  - [x] M1
  - [x] M2
  - [x] M3
  - [x] M4
- [x] 4. Plain language
  - [x] M0
  - [x] M1
  - [x] M2
  - [x] M3
  - [x] M4
- [x] 5. Visualizations
  - [x] M0
  - [x] M1
  - [x] M2
  - [x] M3
  - [x] M4
- [ ] 6. Practice
  - [x] M0
  - [x] M1
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

### Round 2, source fidelity: M1 Divide and Conquer

Checked lectures 4 to 7 and lab 4 against lessons m1-01 to m1-05.

**Already covered:** the three D&C steps; the master theorem with the lg^k n case; merge sort, binary search (find 9 in 3 5 7 8 9 12 15), powering, the four Fibonacci methods and the matrix theorem with its proof; standard, 8-multiplication and Strassen matrix multiplication with the r check; VLSI and the H-tree. Lab 4's four recursion trees, the geometric-sum derivation, Gauss multiplication and its recurrence, the lab task and all three exercises. Quicksort's PARTITION, invariant, worst/best/1:9/alternating cases, randomized quicksort and the full expectation proof. Decision trees (9, 4, 6), the n lg n lower bound with Stirling, counting sort, stability, radix sort, its correctness proof, choosing r, and the punched-card appendix. RAND-SELECT, its expected-time proof, and median of medians with the n ≥ 50 simplification.

**Changed:**
- m1-02: gave both names, Gauss method and Karatsuba's algorithm; said the lab's "two real numbers" means integers, with how to scale decimals.
- m1-03: the partition of 6 10 13 5 8 3 2 11 written out row by row (it was only in the visualizer); named the scheme (Lomuto's) and linked Hoare's two-pointer version in Algorithm Design and Analysis.
- m1-04: counting sort's C after each loop and loop 4 step by step; radix sort's three passes as a table, with the stable tie pointed out. Both checked in Python.
- m1-05: why the naive method sorts with merge sort or heapsort and not quicksort; finished the select example (answer 11).
- m1-01: noted the slide frame with t and u swapped.

**Source errors:**
- Lecture 4: one animation frame shows t = ce + dh and u = cf + dg (should be ce + dg and cf + dh).
- Lab 4: the task says "two real numbers"; the method works on integers.
- Lecture 5 credits quicksort to Hoare, but its PARTITION is Lomuto's scheme (not an error, but the two get confused).

**Found but not fixed:** m1-04 says Hollerith's most-significant-digit-first idea was bad but not why (round 3). m1-05's example uses the first element as pivot although RAND-SELECT picks at random; the slides do the same.

**Not checked:** no browser check; no visualizers changed.

### Round 2, source fidelity: M2 Hashing and Search Trees

Checked lectures 8 to 13 and labs 5.1 and 5.2 against lessons m2-01 to m2-07.

**Already covered:** direct hashing; the division (with the mod 4 vs mod 7 example), multiplication (k = 123 and 150), mid-square and folding methods; amortized analysis by the aggregate, accounting and potential methods; separate chaining with its load-factor analysis, the BST-per-slot extension and AVL; open addressing with HASH-INSERT/SEARCH, "deleted" markers, linear (7, 36, 18, 62, 51), quadratic (including the stuck 2 … 62 mod 10 example) and double hashing (37, 90, 45, 22, 17, 49, 55); the 1/(1 − α) theorem. Lab 5: direct-address tables, the Mia/Ada/Ted example, double hashing of 14 and the 22/27 task, good hash functions, and all three extra exercises (final tables rechecked in Python). Red-black properties, the height proof, rotations, the three insertion cases with the insert-15 example and the 47 … 93 build, deletion with the black token. OS-SELECT/OS-RANK, maintenance under rotations, the methodology, interval trees with both searches and the correctness proof. Skip lists: perfect and randomized, search rule, insert/delete 87, backwards analysis.

**Changed:**
- m2-02: the stuck quadratic example said 3 free slots; there are 4 (0, 4, 5, 9), now with the reason. Added rehashing an open-addressed table (next prime near 2m, and when), the lecture's separate chaining vs. open addressing table, and its "which to use" advice.
- m2-03: the callout claimed double hashing needs fewer probes on the extra exercise and pointed at a probe counter that doesn't exist. The real totals are 16, 23 and 16; the callout now says that, and that the difference is the layout.
- m2-05: the lecture's three deletion examples (delete 87; delete 71 with 51 added; delete 32 through cases 2, 3 and 1), each with a visualizer, read from the slide images. A new test checks the visualizer's code ends with the lecture's exact trees.
- m2-04: a callout on the root update in `leftRotate`.

**Source errors:**
- Lecture 11: the Java `leftRotate` runs `root = z;` on every call, not only when x was the root.
- Lecture 8: quadratic probing is described as "f is a linear function of i"; mid-square says "r = 1 bit" for digits.
- Lecture 13: the Find 71 and Find 96 figures mix in keys (76, 87, 91) from another slide.
- Lab 5.2: the printed answer tables drop the empty slots, so keys look shifted.

**Found but not fixed:** the mid-square method has no worked example in the notes or the lesson (round 3 could add one). The hash visualizer has no running probe total, which the comparison exercise would use (round 5).

**Not checked:** no browser check of the new visualizer instances.

### Round 2, source fidelity: M3 Design Strategies

Checked lectures 14 to 19 against lessons m3-01 to m3-05 (lecture 19 is only a Dijkstra table on A to G).

**Already covered:** DP's main idea and Bellman; Fibonacci bottom-up; coin-row (5 1 2 10 6 2, answer 17, coins, time and space); binomial coefficients; the robot board; LCS (president/providence → priden, algorithm/alignment → algm); 0-1 knapsack with the pseudocode and backtracking. Greedy: the algorithm categories, counting money ($6.39, krons), the three scheduling answers (35, 40, 34), Huffman's 2.42 bits/char, MST, the travelling salesman, the analysis and other greedy algorithms. Graph representations and the handshaking lemma, optimal substructure and the greedy-choice theorem with cut-and-paste proofs, Prim with its heap table, safe and light edges, cuts, Kruskal with its O(E lg E) analysis, greedy vs. DP, the design steps, prefix codes, full binary trees, HUFFMAN with both proofs, activity selection. Dijkstra's properties, the A to E example, the A to G table, the three-part correctness proof, the analysis, and BFS as Dijkstra with a FIFO queue.

**Changed:**
- m3-01: the C(6, 3) table (answer 20) and the full knapsack table, with the slide's "?" at V[4, 2] worked out (15). Both checked in Python.
- m3-02: the lecture's two open exercises, connecting wires and collecting coins with the fewest robots, with answers. A brute-force search found the counterexample to "nearest free dot" (B B W W W B: 7 vs 5) and confirmed the row-by-row robot rule on 300 random boards.
- m3-03: both MST visualizers now run the lecture's Prim graph (a to h, total 53; read from the slide image) instead of a made-up one, with Prim's and Kruskal's edge orders written out. A test checks the total and both orders.
- m3-05: the lecture's directed BFS example (a to i), dequeued step by step to `a b d c e g i f h`. A test runs the library's directed BFS on it.

**Source errors:** none new in the content. Lecture 15's travelling-salesman costs (16 vs 14) and the scheduling answers were rechecked and are right.

**Found but not fixed (round 5):** `GraphTraversal` can't draw directed graphs or letter labels in its queue, so the BFS example has a table but no visualizer. The robot DP visualizer's board wasn't compared with the slide images (slides 17 to 19 are pictures).

**Not checked:** no browser check of the new MST graph layout.

### Round 2, source fidelity: M4 P and NP

Checked lecture 20 against lesson m4-01.

**Already covered:** problem, search space and brute force; O, Ω and Θ; the complexity-vs-input-length table; P with its examples; NP with the verification definition the slides lack; TSP and its search-space table; clique; P vs. NP and the prize; NP-hard and NP-complete; reduction with the LCM/GCD and linear/quadratic examples; SAT with the 11-clause formula and both small formulas; 3-CNF SAT to CLIQUE, decision vs. optimization, and the lecture's three-clause example.

**Changed:**
- the 2-clause, 3-variable SAT formula now has its answer (five satisfying rows), and a note that the slide's table is filled in for (a ∨ ¬c), not the printed (b ∨ ¬c). Both tables checked in Python.
- the TSP table counts orderings (N!); added that there are (N − 1)!/2 different tours, and that the growth is the same.
- answered the lecture's question about the clique of size 3 (x₃, x₂, x₃ → x₂ = x₃ = TRUE), and said why two-literal clauses still count as 3-CNF.

**Source errors:**
- the 3-variable SAT slide prints one formula and tabulates another.
- the NP slide says there is "no way" to find the optimum other than searching; that's unknown, not proven, and NP is really about verifying. (The lesson already said so.)
- the NP-hard slide lists NP-complete properties under NP-hard. (The lesson already moved them.)

**Found but not fixed:** none.

**Not checked:** no browser check.

Round 2 is complete for all modules. Next: round 3, depth, starting with M0.

### Round 3, depth: M0 Foundations

Read m0-01 to m0-06 as someone meeting the subject for the first time, looking for terms used before they're defined, skipped steps, claims with no reason, and ideas with no common mistake.

**Changed:**
- m0-01: Θ(n²) was used in the first section before any explanation; it now says how to read it. Insertion sort had no best case; added Θ(n) with the reason (one comparison per pass). The worst case's "arithmetic series" now shows the sum and its value at n = 1000. A callout on simplifying Θ (keep only the fastest-growing term, drop its constant; 5000n + 0.001n² is Θ(n²)).
- m0-02: where the binary search counts 8, 11, 21, 33 come from (lg n + 1). Why fib's call count more than doubles: T(n) = 1 + T(n−1) + T(n−2), checked against the table. A callout on counting the basic operation, not swaps, for exchange sort.
- m0-03: a callout that Big-O is only an upper bound (3n + 2 is also O(n²)).
- m0-04: the binary search substitution proof now has its base case (n₀ = 2, c = 2), which was the gap round 2 found. Why the iteration method assumes n = 2ᵏ. A callout with three master-method slips (mixing up a and b, shown on 4T(n/2) + n; skipping regularity; treating a log factor as polynomial).
- m0-05: a callout on C's precedence trap (`x & 1 == 0` is always false) and on shifting past bit 31.
- m0-06: the two-call FastPower bug that turns Θ(log b) into Θ(b), and the min-max task for odd n (3(n − 1)/2 comparisons), with the skipped-last-element bug.

**Checked and left as is:** the master method's cases, the substitution examples other than binary search, the recursion-tree level argument, the term-contribution experiments, the 1.5n − 2 derivations, and the binary-file functions already give their reasons.

**Found but not fixed:** m0-03 is long (maths revision plus all of asymptotic notation); round 4 should check it reads in order.

**Not checked:** no browser check; no visualizers changed.

### Round 3, depth: M1 Divide and Conquer

Read m1-01 to m1-05 as a first-time reader. Only m1-04 had a common-mistake callout.

**Changed:**
- m1-01: the two-call power bug (Θ(n) instead of Θ(lg n)); what 2.81 vs 3 means in numbers (8¹⁰ ≈ 1.07 billion vs 7¹⁰ ≈ 282 million multiplications at n = 1024).
- m1-02: the Gauss method worked by hand on 1234 × 5678 (672, 2652, 6164, middle 2840, product 7,006,652, checked in Python), with two coding slips: sums one digit longer, and shifts when n is odd.
- m1-03: why equal keys are a worst case for this PARTITION (5 5 5 5 5 splits 4 : 0), and the three-way partition libraries use.
- m1-04: why most-significant-digit-first radix sort is bad (piles that must be kept apart), which round 2 left open.
- m1-05: the forgotten "− k" when going right, shown on the lesson's example.

**Checked and left as is:** the master theorem uses, the Fibonacci matrix proof, Strassen's r check, the H-tree recurrence, the recursion-tree problems, the quicksort expectation proof, the decision-tree bound and median of medians already give their reasons step by step.

**Found but not fixed:** m1-02's problem 2 shows O(n log n) but not the matching lower bound (the shortest branch has log₃ n full levels); round 6 could ask for it. m1-03 is long; round 4 should check it.

**Not checked:** no browser check; no visualizers changed.

### Round 3, depth: M2 Hashing and Search Trees

Read m2-01 to m2-07 as a first-time reader. Only m2-04 had a common-mistake callout (added in round 2).

**Changed:**
- m2-01: a worked mid-square example (4567² = 20857489 → 57), which round 2 found missing. The potential method's "comes out to 3" now shows the arithmetic for both a cheap and an expensive insertion, and why Φ ≥ 0. A callout on growing by a fixed amount instead of doubling (Θ(n²) total).
- m2-02: a callout on wrapping round with mod m.
- m2-03: why h₂ has "1 +" (h₂(22) = 0 would probe one slot forever) and why m should be prime.
- m2-04: the induction step of the 2^bh − 1 bound, which was stated but not shown. A callout that "balanced" allows one path twice as long as another, shown on the lecture's tree.
- m2-05: a callout on coloring the new node black, and on using x's sibling instead of the uncle.
- m2-06: a callout on the order of size updates after a rotation.
- m2-07: a callout that O(log n) is expected, not worst case, and why no input can force the bad case.

**Checked and left as is:** the aggregate and accounting methods, chaining's 1 + α, open addressing's 1/(1 − α), the deletion marker, the insertion cases, the black-token deletion table, OS-SELECT/OS-RANK, interval-search correctness and the backwards analysis of skip lists already give their reasons.

**Found but not fixed:** none.

**Not checked:** no browser check; no visualizers changed.

### Round 3, depth: M3 Design Strategies

Read m3-01 to m3-05 as a first-time reader. Only m3-02 had a common-mistake callout (greedy coin change).

**Changed:**
- m3-01: why greedy fails on the coin row (2 10 11 10: greedy 13, DP 20), and subsequence vs. substring ("president"/"providence" share at most "iden" as a substring but "priden" as a subsequence).
- m3-03: Prim's "cheapest edge anywhere" and Kruskal's missing cycle check, both on the lecture's graph; what happens with equal weights (the MST may not be unique).
- m3-04: the two greedy rules that look right for activity selection and fail (shortest first, earliest start), each with a three-activity counterexample.
- m3-05: Dijkstra on a negative edge, a four-vertex example where it reports 2 for a distance of 1.

All counterexamples were checked by brute force in Python. While checking, I caught two wrong claims in my own draft (that the longest common substring was "den", and that "pred" is a substring of "president") and fixed them before committing.

**Checked and left as is:** the DP recurrences each give the "with or without the last item" reason; the MST cut-and-paste proofs, the Huffman exchange and substructure proofs, the activity-selection exchange proof and Dijkstra's three-part correctness proof are complete.

**Found but not fixed:** Bellman–Ford is named in the new m3-05 callout but no lesson teaches it; round 7 could link it to another course if one covers it.

**Not checked:** no browser check; no visualizers changed.

### Round 3, depth: M4 P and NP

Read m4-01 as a first-time reader. It had no common-mistake callout.

**Changed:**
- why "input length" means digits, not value: trial division up to √N is about 10^(d/2) steps for a d-digit number, which is why primality was only placed in P in 2002.
- a callout that NP doesn't mean "not polynomial" (sorting is in NP).
- a callout on the direction of a reduction: reduce the known hard problem to the new one, as SAT → CLIQUE does.

**Checked and left as is:** the verification meaning of NP, P ⊆ NP, the NP-hard/NP-complete definitions, the LCM and linear-equation reductions, the 2ⁿ rows argument for SAT and the clique construction's "why it works" already give their reasons. The SAT and clique answers were added in round 2.

**Found but not fixed:** none.

**Not checked:** no browser check.

Round 3 is complete for all modules. Next: round 4, plain language, starting with M0.

### Round 4, plain language: M0 Foundations

Scanned m0-01 to m0-06 with a script for sentences over 28 words and for stock hard words (utilize, thereby, in terms of, i.e., hence, simply and so on), skipping code, maths and tables, then read the flagged lines and rewrote them by hand.

**Changed (16 edits):**
- split the long sentences: the merge example, the basic-operation opening, the lecture-typo callout, the missing-key probability, the easy/hard/unsolvable problems, the Big-O promise, the log-factor slip, the `1 << 31` slip, the XOR identity and the odd-n min-max step.
- replaced "in terms of" (an idiom non-native readers trip on) with "using" in the recurrence definitions.
- explained two terms on first use: "subroutine" (a helper step) and "nondecreasing" (ascending, with equal keys allowed).
- dropped a filler "simply".

**Checked and left as is:** the lessons were already mostly short sentences. Technical terms that stay (asymptotic, recurrence, regularity condition, polynomial factor) are the right names and are explained where they first appear.

**Couldn't do:** the round's guide says to run the text through the humanizer skill; that skill isn't installed here, so the rewriting was done by hand.

**Not checked:** no browser check.

### Round 4, plain language: M1 Divide and Conquer

Same method as M0: a script flagged sentences over 28 words and stock hard words in m1-01 to m1-05, then I rewrote the flagged lines by hand.

**Changed (16 edits):** split the long sentences in the Strassen slide note and the 8-vs-7 count (m1-01), the H-tree side length (m1-01), the recursion-tree pattern, the odd-n shift slip, the lab hint and the local-minimum exercise (m1-02), the divide step, the PARTITION result and the `std::sort` note (m1-03), the radix-sort history (m1-04, also dropping "simply"), and the "− k" slip and the median-of-medians argument (m1-05).

**Checked and left as is:** pivot, partition, recurrence, decision tree, stable, order statistic and the other technical terms are explained where they first appear; the proofs are already broken into short steps.

**Couldn't do:** the humanizer skill isn't installed here.

**Not checked:** no browser check.

### Round 4, plain language: M2 Hashing and Search Trees

Same method: a script flagged sentences over 28 words and stock hard words in m2-01 to m2-07, then I rewrote the flagged lines by hand.

**Changed (20 edits):** split the long sentences in the potential-method note (m2-01); the AVL definition, rehashing, the wrap-round slip, the stuck quadratic example and open-addressing rehashing (m2-02); simple uniform hashing and the probe totals (m2-03); the black-height count, the minimum black-height, the "twice as long" promise and the root-update slip (m2-04); the black-new-node slip and the deletion examples' starting tree (m2-05); the rotation-order slip (m2-06). Dropped four filler "simply"s. Added "like express lanes" to the skip-list name (m2-07).

**Checked and left as is:** load factor, probe sequence, black-height, rotation, augmenting and the other technical terms are explained where they first appear. The red-black case tables are already short.

**Couldn't do:** the humanizer skill isn't installed here.

**Not checked:** no browser check.

### Round 4, plain language: M3 Design Strategies

Same method: a script flagged sentences over 28 words and stock hard words in m3-01 to m3-05, then I rewrote the flagged lines by hand.

**Changed (19 edits):** split the long sentences in the coin-row rule (m3-01); the scheduling setup, the MST step and the robot exercise (m3-02); the Kruskal safety argument and the Prim slip (m3-03); the design steps, the full-binary-tree induction step and the optimal-substructure statement (m3-04); the lesson opening, the paper table, the correctness proof and the BFS result (m3-05). Replaced "clearly", "arbitrary", "in terms of" and "thus".

In m3-02 the "clearly optimal" bullets had their reasons repeated after a "Why?"; they now say each point once. My first draft of the "other optimal solutions" example (swap the 10 and the 11) was wrong (33 and 35), so it now uses 20 + 14, 18 + 10 + 6, 15 + 11 + 5 + 3, checked in Python.

**Checked and left as is:** recurrence, optimal substructure, greedy choice, cut, light edge, prefix code, relaxation and the other technical terms are explained where they first appear.

**Couldn't do:** the humanizer skill isn't installed here.

**Not checked:** no browser check.

### Round 4, plain language: M4 P and NP

Same method: a script flagged sentences over 28 words and stock hard words in m4-01, then I rewrote the flagged lines by hand.

**Changed (5 edits):** split the 2ⁿ-rows sentence and the clique-construction rule; simplified the definition of a reduction ("solving that instance of Q also solves the instance of R"); replaced "in terms of" in the primality note.

**Checked and left as is:** P, NP, NP-hard, NP-complete, certificate, reduction, CNF and clique are explained where they first appear.

**Couldn't do:** the humanizer skill isn't installed here.

**Not checked:** no browser check.

Round 4 is complete for all modules. Next: round 5, visualizations, starting with M0.

### Round 5, visualizations: M0 Foundations

Listed every idea in m0-01 to m0-06 that is still only text and judged whether a reader needs something to step through.

**Built:** the min-max **Algorithm 2** (merge the pairs) as a second mode of `MinMaxVisualizer`, with its own C++ and a toggle between the two algorithms. Each merge highlights the piece being merged and compares only its two fronts and two backs. Logic in `minMaxMergeFrames` (`src/lib/advancedAlgorithms.ts`); a test checks it ends on the corrected row from round 2 with 22 comparisons, and gives the true min and max in exactly 1.5n − 2 comparisons for every power of 2 up to 64. It's in m0-06 under the static table.

**Judged and left as text:** the substitution proofs (a proof, read line by line), the add-count table, the missing-key average case (three worked values are enough), the odd-n min-max case, and the binary-file `fseek` example (students run the lab code). Insertion and merge sort, binary and linear search, the Fibonacci calls, term contributions, Big-O witnesses, growth, recursion trees, the bit operators, popcount and fast power already have visualizers.

**Phone width, dark theme, reduced motion (code audit, not a browser check):**
- every Stepper draws inside an `overflow-x-auto` panel, so the 16-cell arrays and the 420–480px tables scroll inside their box instead of widening the page;
- no hard-coded colours in the visualizer files; everything uses the theme tokens, so dark mode follows;
- animated moves already had `motion-reduce:transition-none`; the array cells' colour fade didn't, and now does (this affects every array visualizer on the site).

**Couldn't check:** no browser automation is installed (no Playwright or Puppeteer), so nothing was looked at in a real browser at phone width or in dark mode. Installing Playwright would add a dev dependency and browser downloads, so I left that for you to decide.

### Round 5, visualizations: M1 Divide and Conquer

Listed every idea in m1-01 to m1-05 that is still only text and judged whether a reader needs something to step through.

**Built:**
- `VlsiLayouts` (m1-01): the obvious layout and the H-tree side by side on a grid, for 4, 16 or 64 leaves, with their areas (21 vs 9, 155 vs 49, 889 vs 225). The section had only recurrences before. Logic in `hTreeLayout` and `plainTreeLayout`; a test checks the side lengths follow L(n) = 2L(n/4) + 1 and W(n) = 2n − 1, every leaf gets its own grid point, and the H-tree is smaller for k = 1 to 4.
- m1-03: the existing quicksort stepper now also runs on eight equal keys, under the round 3 callout, so the 7 : 0 splits can be stepped through instead of only described.

**Judged and left as text:** the master theorem's lg^k n case (the recurrence explorer covers it), the Fibonacci matrix proof, the expected-time proofs, the Ω(n lg n) decision-tree argument and the median-of-medians recurrence. Merge sort, binary search, fast power, Strassen, Gauss multiplication, recursion trees, partition, decision trees, counting and radix sort, select and median of medians already have visualizers.

**Phone width, dark theme, reduced motion (code audit):** the new SVGs scale with `w-full h-auto` and stack into one column below the `md` breakpoint; they use theme classes only (`stroke-violet`, `fill-mint`, `stroke-border`) and have no animation.

**Couldn't check:** no browser automation is installed, so nothing was looked at in a real browser.

### Round 5, visualizations: M2 Hashing and Search Trees

Listed every idea in m2-01 to m2-07 that is still only text and judged whether a reader needs something to step through.

**Built:** `LoadFactorChart` (m2-02), a slider for the load factor α with both curves, 1/(1 − α) for open addressing and 1 + α for chaining, and the probe counts at the chosen α. The lesson had only the 0.5 and 0.9 values in text. Logic in `expectedProbes`; tested at 0.5 and 0.9.

**Correction to round 2:** round 2 said the hash-table visualizer had no probe counter and rewrote an m2-03 callout around that. It does: the frames carry a running `probes` stat, which the stepper shows. Round 2 had only searched the component file, not the library. The callout points at the counter again, and a new test checks the counter gives the lesson's 16, 23 and 16 on the extra exercise.

**Judged and left as text:** the BST-per-slot extension (the cases are best read as a list), the potential method's arithmetic, the red-black height proof, OS-RANK's walk up the tree (OS-SELECT has a stepper and RANK is its mirror), and the skip-list backwards analysis. Hash functions, doubling cost, every probing scheme, red-black insert and delete (including the lecture's three deletions), rotations, OS-SELECT, interval search and skip lists already have visualizers.

**Phone width, dark theme, reduced motion (code audit):** the new chart scales with `w-full h-auto`, uses theme classes only, and doesn't animate.

**Couldn't check:** no browser automation is installed, so nothing was looked at in a real browser.

### Round 5, visualizations: M3 Design Strategies

Listed every idea in m3-01 to m3-05 that is still only text and judged whether a reader needs something to step through.

**Built:** directed graphs for `GraphTraversal`, the gap round 2 logged. `GraphSvg` takes a `directed` flag and draws an arrowhead on each edge in the edge's own colour; `traversalFrames` takes node names, so the step messages, the queue and the visit order show letters instead of numbers. m3-05 now steps through the lecture's directed a to i graph (positions from the slide), and the generic undirected BFS that sat next to it was removed as redundant. A test checks the order `a b d c e g i f h` and that the messages use the letters. Algorithm Design and Analysis uses the same component with the defaults (undirected, no labels) and is unchanged.

**Judged and left as text:** the DP recurrences' derivations, the greedy-choice and optimal-substructure proofs, the Huffman exchange argument, the scheduling example (it has its own visualizer), and Dijkstra's correctness proof. Coin-row, binomial, robot, LCS and knapsack tables, Huffman, both MST algorithms on the lecture graph, activity selection, and Dijkstra already have visualizers.

**Phone width, dark theme, reduced motion (code audit):** the arrowheads use the same theme classes as their edges (`fill-` for `stroke-`) and the graph SVG already scales to its container; nothing new animates beyond the existing colour transition.

**Couldn't check:** no browser automation is installed, so the arrow placement wasn't looked at in a real browser.

### Round 5, visualizations: M4 P and NP

Listed every idea in m4-01 that is still only text and judged whether a reader needs something to see or play with.

**Built:** `PvsNpDiagram`, the lecture's "two possible worlds" picture, with a toggle between P ≠ NP and P = NP and example problems in each region (sorting, shortest paths, MST and primality in P; SAT, CLIQUE and decision TSP in NP-complete; shortest-tour TSP and the halting problem in NP-hard only). NP-hard is drawn as its own region reaching outside NP, the point students most often draw wrong. A geometry check confirmed the NP-complete region lies inside both NP and NP-hard. It's a static picture with no algorithm, so there's no library logic to test; the lesson render test covers it.

**Checked:** the SAT explorer's second preset is (a ∨ b) ∧ (b ∨ ¬c), as the lesson tells readers.

**Judged and left as text:** the reduction definition and the LCM/GCD and linear/quadratic examples (one line each), the TSP table (the growth table covers the shape), and the input-length argument for primality. The growth table, SAT explorer and SAT-to-CLIQUE builder already cover the rest.

**Phone width, dark theme, reduced motion (code audit):** the SVG scales with `w-full h-auto`, uses theme classes only, and doesn't animate.

**Couldn't check:** no browser automation is installed, so the label placement wasn't looked at in a real browser.

Round 5 is complete for all modules. Next: round 6, practice, starting with M0. Check upstream PR #63 (an 80-question Advanced Algorithms question bank) first, so the work isn't duplicated.

### Round 6, practice: M0 Foundations

**How this round works (your instructions, 2026-11-06):** every lesson ends with a **Practice from past exams** section built from the past midterms and finals. **Part 1** holds midterm questions and **Part 2** final-exam questions. Multiple-choice questions use the quiz style; written questions show the question with a **Show model answer** button. A question asked in several years appears once, labelled with every year. Questions are labelled only by exam and year, with no names. Upstream PR #63 (an 80-question bank in `questions.ts`) is a separate format and isn't touched.

**Built for this:**
- `ModelAnswer` (`MdxComponents.tsx`): a button that shows and hides a written question's model answer.
- `Quiz` got a `practice` flag. A practice quiz doesn't save a score or mark the lesson complete (otherwise two quizzes in one lesson would overwrite each other's score and silently complete the lesson). It shows "x/y correct" and a "Try again" button.
- `src/test/practice-questions.test.tsx` tests both, and that a normal quiz still saves its score. CLAUDE.md documents them.

**Added (from 8 midterms, 6 finals and an exam-examples sheet):**
- m0-01: insertion vs. merge crossover (2 ≤ n ≤ 43); merge sort's every case by recursion tree; 6 final MCQs (merge sort cases, merging m + n and m + n + p, efficiency measures, worst case, n¹⁰⁰ vs 10ⁿ).
- m0-02: F(n − 1) + F(n − 3) is exponential (about 1.466ⁿ) and becomes O(n) with an array; the Fibonacci version; 5 final MCQs (the x = N(N − 1)/2 loop, search cases, binary search).
- m0-03: growth-rate orders (increasing and decreasing); the nested-loop question asked in five papers, with every variant (÷2, ÷3, ÷4, j = n²); sum 1..n two ways; n^2.1 vs n² log n; 6 final MCQs (including the halving loop that is O(n), not O(n log n)).
- m0-04: the master-method trio asked in four papers; five more recurrences in a table; 2T(n/4) + √n; T(64) = 992 and T(512) = 4096 computed step by step; recursion tree and iteration; two true/false; 3 final MCQs.
- m0-05: no exam has asked about this lab; the section says so.
- m0-06: fast power, k-way merge (Θ(nk²)), unimodal maximum and A[i] = i by binary search, a^b with the master method, min and max in 1.5n − 2, 3-way merge sort, 1 MCQ.

All numeric answers were checked in Python (crossover, 1.466 root, both recurrence values, the halving loop, 9! > 4⁹, the x loop).

**Source errors:** the 2018 midterm prints "n > 32" for the Fibonacci case; one final's "T(1) = 5, T(n) = 5T(n/4) + n, n = 32" isn't solvable (32 isn't a power of 4), so it was left out; the 2019 answer sheet's counting-sort table has slips (for round 6 M1).

**Not checked:** no browser check of the new button and quiz layout.

### Round 6, practice: M1 Divide and Conquer

Same format as M0: every lesson ends with past-exam practice, Part 1 midterms and Part 2 finals.

**Added:**
- m1-01: Fibonacci three ways with F(5) (asked in three midterms), Fibonacci of 16 in four squarings (F₁₆ = 987, two midterms), the maximum-subarray functions from 2025 (Θ(n lg n)), counting inversions with merge sort traced on [5, 7, 2, 1, 4, 3, 6, 8] (11 inversions, in the order found), Strassen true/false; 5 final MCQs (the three steps, recursion, Strassen, binary search on sorted data, where merge sort's work is).
- m1-02: levels of a binary tree by divide and conquer (Θ(n)); algorithms A, B and C from two finals (choose C, O(n² log n)).
- m1-03: the full quicksort trace of (5, 2, 4, 8, 0, 3, 1, 7) with this course's PARTITION; best case by recursion tree; worst case, 1/10 : 9/10 and lucky/unlucky; 4 final MCQs (T(n − 1) + Θ(n), divide and conquer, lowest worst case, not in place).
- m1-04: both counting sorts with their C tables, and the worst-case table asked in three midterms. No final asked about this lesson; the section says so.
- m1-05: median of two sorted arrays, naive and O(log n). No final asked about selection; the section says so.

Every trace and count was checked in Python.

**Source errors:** the 2019 counting-sort answer sheet gives the output as "1 2 3 5 6 1 8" (should be 1 2 3 5 6 7 8); its recursive-squaring code declares `int x[2][3]` for a 2 × 2 matrix.

**Left out:** the 2024 retake's top-down min-heap question and the 2024 build-heap proof, because heaps aren't taught in this course. One final's "purpose of randomized quicksort" MCQ was left out because its options are ambiguous (randomizing doesn't lower the worst case; it makes the expected time Θ(n lg n) on every input).

**Not checked:** no browser check.
