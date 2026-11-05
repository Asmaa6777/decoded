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
- [ ] 4. Plain language
  - [x] M0
  - [x] M1
  - [x] M2
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
