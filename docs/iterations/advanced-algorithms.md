# Advanced Algorithms & Analysis: iteration rounds

Tracks the Advanced Algorithms & Analysis course through the rounds in [Build in iterations](../building-a-course.md#build-in-iterations). Each round is committed on its own, ticks its box here, and adds its report below.

Modules: **M0** Foundations of Analysis · **M1** Divide and Conquer · **M2** Hashing and Search Trees · **M3** Design Strategies · **M4** P and NP

- [x] 1. Skeleton (whole course)
- [ ] 2. Source fidelity
  - [x] M0
  - [x] M1
  - [x] M2
  - [x] M3
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
