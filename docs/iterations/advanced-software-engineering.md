# Advanced Software Engineering: iteration rounds

Tracks the Advanced Software Engineering course through the rounds in [Build in iterations](../building-a-course.md#build-in-iterations), adapted for a course with no past exams: there is no exam-integration round, and the practice rounds write their own questions from the lectures, split into a multiple-choice round and a system/diagram round. Each round is committed on its own (commit messages say "Part of this issue"), ticks its box here, and adds its report below.

The course follows the lectures, not chapters. Each module is one lecture, labelled **Lecture N** in the registry, and ends with a **Lecture N Practice** lesson holding a scored multiple-choice quiz and a separate set of system and diagram questions.

Lectures: **L1** Foundations of Modern Engineering: The AI-Augmented SDLC · **L2** Foundations of Modern Engineering · **L3** SOLID Principles · **L4** Architectural Views · **L5** Building Software Architecture (with the ten-styles infographic)

- [x] 1. Skeleton (whole course)
- [ ] 2. Source fidelity
  - [x] L1
  - [x] L2
  - [x] L3
  - [ ] L4
  - [ ] L5
- [ ] 3. Depth
  - [ ] L1
  - [ ] L2
  - [ ] L3
  - [ ] L4
  - [ ] L5
- [ ] 4. Plain language
  - [ ] L1
  - [ ] L2
  - [ ] L3
  - [ ] L4
  - [ ] L5
- [ ] 5. Terminology (highlight + definition popup)
  - [ ] L1
  - [ ] L2
  - [ ] L3
  - [ ] L4
  - [ ] L5
- [ ] 6. Visualizations
  - [ ] L1
  - [ ] L2
  - [ ] L3
  - [ ] L4
  - [ ] L5
- [ ] 7. MCQ practice
  - [ ] L1
  - [ ] L2
  - [ ] L3
  - [ ] L4
  - [ ] L5
- [ ] 8. System and diagram questions
  - [ ] L1
  - [ ] L2
  - [ ] L3
  - [ ] L4
  - [ ] L5
- [ ] 9. Connections (whole course)
- [ ] 10. Student read-through
  - [ ] L1
  - [ ] L2
  - [ ] L3
  - [ ] L4
  - [ ] L5
- [ ] 11. Real readers (whole course)
- [ ] 12. Final quality review (whole course)

## Reading the slides cheaply

Text copies of all six slide decks are in `_sources/advanced-software-engineering/*.md` (git-ignored, never committed). Five were made with [markitdown](https://github.com/microsoft/markitdown) (`markitdown deck.pdf > deck.md`). The week 5 "Building Software Architecture" deck has broken font encoding, so its copy was made with OCR (`pdftoppm -r 150` then `tesseract`, one `## Slide N` heading per page). Read these first; open a slide image only to check a diagram.

## What each round must deliver

| # | Round | Done when |
| --- | --- | --- |
| 1 | Skeleton | Every lecture has lessons and a practice lesson, the course is registered, the term popup and diagram components exist, every hard idea has one visualization, and lint, tests and build pass. |
| 2 | Source fidelity | Every topic, definition, example, diagram, table and dilemma on the lecture's slides is in a lesson, with the slide's name for it. Source errors are listed. Nothing invented is presented as coming from the slides. |
| 3 | Depth | Every term is explained before it's used, every example is walked through, and each lesson names the mistake students usually make. |
| 4 | Plain language | Short sentences, the simplest accurate word, no jargon a non-native speaker would have to look up twice. |
| 5 | Terminology | Every genuinely difficult term is a `<Term>` at its first use in each lesson, with one consistent glossary definition; easy words are not highlighted; each content lesson ends with `<KeyTerms>`. |
| 6 | Visualizations | Every idea still only in text has been judged; architecture, UML, sequence and process diagrams added where they teach something; every diagram works at phone width and in both themes. |
| 7 | MCQ practice | Each lecture's quiz covers every lesson, mixes conceptual, terminology, scenario, comparison, "which is NOT" and design-decision questions, has plausible distractors, and explains every answer. |
| 8 | System and diagram questions | Each lecture has system interpretation, diagram interpretation, missing component, error detection, sequence, relationship, design decision and diagram construction questions where the material allows, each with a figure and an explanation. |
| 9 | Connections | Ideas used in one lecture link to the lecture that teaches them; commonly confused pairs are contrasted; paths and prerequisites are set. |
| 10 | Student read-through | A fresh read as a first-time student lists every confusing, unclear or boring place; a separate pass fixes it. |
| 11 | Real readers | Students use the course and report problems. |
| 12 | Final review | All of the above re-checked against the final-quality list in the original request. |

## Analysis done before round 1

Read all six source PDFs (lectures 1 to 5 and the week 5 styles infographic), the repository's course conventions (`CLAUDE.md`, `docs/building-a-course.md`, the Advanced Algorithms tracker, the registry, the MDX components and the advanced-algorithms test), and checked the upstream repository. **No Advanced Software Engineering course existed** in this fork or upstream, so round 1 built it from the slides rather than improving an existing one.

### Concepts, hard terms and planned visuals per lecture

| Lecture | Concepts | Difficult terminology | Visualizations | Good for MCQ | Good for system/diagram questions |
| --- | --- | --- | --- | --- | --- |
| L1 | course goals, scaling myth, "wait for GPT-N", black-box fallacy, SWE-bench case study (premature victory, context rot, overwhelmed execution), the harness (initializer/worker, compaction, progressive tooling, verification gates, architectural inversion), PID case study, float32 absorption, typosquatting supply-chain attack | SDLC, LLM, context window, context rot, agent harness, deterministic, verification gate, PID, feedback loop, float32, absorption, HIL, supply chain attack, typosquatting, hallucination | harness diagram, feedback loop, the slide's sequence diagram, float32 accumulator demo, attack path | failures ↔ harness mechanisms, PID terms, why tests passed | next message in the sequence, missing verification gate, flawed review process |
| L2 | software crisis, essential vs accidental complexity, Brooks' four properties, architecture/design continuum, definition of architecture, architectural vs design details, house analogy, economic goal, clean-up-later fallacy, behavior vs structure, cost-friction (scope/shape), Eisenhower matrix, extreme trade-offs table, 4D model, eight expectations, Pets.com, 2002 data center, depth vs breadth and knowledge pyramid, process vs practices, two laws, circle of life, hands-on strategies, ML paradigm shift, when (not) to use ML, four pillars, SWE vs ML table, three dilemmas | essential/accidental complexity, software architecture, architectural decision, coupling, decoupling, behavior/structure value, scope/shape of change, architecture characteristics, fitness function, elastic scale, technical depth/breadth, unknown unknowns, trade-off, ADR, POC, critical path, data drift, silent failure, stationarity, interpretability, latency, throughput, QPS | architect/developer diagram, cost-per-feature curve, Eisenhower matrix, knowledge pyramid, rules vs ML pipeline, ML decision path | complexity types, scope vs shape, 4D dimensions, laws, when not to use ML | knowledge-pyramid direction, rules-vs-ML design decision, process-vs-practice error |
| L3 | design principle, automotive challenges, OO recap, SOLID table; SRP (actor model, itself test, FrontCamera, FFI, MediaLibrary feature envy → delegation); OCP (feature manager, composition root, routing strategy, inheritance vs delegation table); LSP (contracts, OccupancyGrid3D, path planner, ambiguity tables, two-step fix, inheritance vs delegation, composition/aggregation); ISP (VehicleOperator, dummy implementations, client table, segregated interfaces); DIP (sensor fusion, adapters, composition root, inversion vs injection); three dilemmas | design principle, SOLID, each principle, actor, god class, feature envy, code smell, Information Expert, refactoring, delegation, polymorphism, abstraction, composition root, Strategy, Template Method, behavioral contract, pre/postcondition, composition, aggregation, fat interface, attack surface, least privilege, high-level policy, low-level detail, adapter, dependency injection, FFI, ASIL, OTA, ADAS, IVI, SIL/HIL | itself-test interactive, before/after class diagrams, change-impact explorer (OCP, DIP), LSP height scene, dependency-direction flip, ISP dependency diagrams | which principle is violated, contract rule, inversion vs injection, inheritance vs delegation | spot the violated principle in a diagram, missing interface, composition vs aggregation, choose the right interface |
| L4 | views and documentation, quality attributes per view, structure vs view, one system many views, three kinds of structures, module vs component, module structures (decomposition, uses, generalization, data model), ATIA-M examples, C&C views and questions, concurrency, UML component notation, allocation views (deployment, install, work assignment) | view, structure, module, component, connector, module/C&C/allocation view, decomposition, uses, generalization, data model, provided/required interface, port, concurrency view, resource contention, deployment/install/work-assignment style, artifact | climate-control system in three views, decomposition vs client-server, A/B/C/D/E package, ATIA-M decomposition and uses, UML component notation, lollipop redraw, deployment diagram, install view, work-assignment table | structure vs view, module vs component, which view answers which question, notation | identify the view type, decomposition with two parents, why the arrows should be lollipops, which view to draw |
| L5 | views recap, styles vs views, properties of styles, topologies, role of the architect, process (requirements → design → validation, iterative), step 2a/2b, style list, n-tier, client-server, P2P (+ Napster), pipe-and-filter (two views, UNIX example), messaging, the infographic's ten styles with examples, pros and cons | architectural style, topology, architecturally significant requirements, non-functional requirement, n-tier, client-server, thin client, separation of concerns, synchronous/asynchronous, P2P, pipe-and-filter, filter, pipe, messaging, message queue/broker, implicit invocation, publish-subscribe, event-based, web services, microservices, single point of failure, eventual consistency, API gateway, replication | topologies, process flow, step-2 input/output, n-tier tiers and machines, client-server, P2P, pipeline runner, filter C&C and module views, message-queue stepper, implicit invocation / pub-sub / event-based tabs, SOA triangle, microservices | properties of styles, process steps, quality attributes per style, matching examples to styles | which tier holds business rules, missing pub/sub broker, next step after a queue write, choose a style, shared-database microservices error |

## Reports

Newest last.

### Round 1, skeleton: whole course

**Built:**
- `src/content/advanced-software-engineering/`: 24 lessons, `m1-01` to `m5-05`, five lectures (2 + 4 + 5 + 4 + 4 content lessons, plus one practice lesson per lecture). Registered in `src/content/registry.ts` with module labels `Lecture 1` to `Lecture 5`, accent `sky`, authored by Asmaa Farouq.
- `glossary.ts`: 129 terms with one short definition each and the lecture that teaches it.
- `src/components/mdx/SoftwareEngineeringVisualizers.tsx`:
  - `Term`: the highlighted word with a definition popup. It opens on hover (with a delay) or on tap/click, closes on Escape or outside click, sits above the text (`side="top"`, collision padding) and uses the sky accent bar like the lesson-link previews.
  - `KeyTerms`: the "Key terms" recap at the end of every content lesson.
  - `BoxDiagram`: an SVG diagram for architecture, UML and system pictures: boxes, components, lollipop interfaces, cylinders (stores), packages, 3-D nodes, notes, "?" missing slots, arrows, inheritance/realization triangles, dashed dependencies and curved edges.
  - `SequenceDiagram`: UML sequence diagrams, with a hidden-message mode for "what happens next?" questions.
  - `DiagramTabs` (before/after and multi-view tabs) and `ChangeImpact` (pick a change request and see what each design edits or adds).
  - `FloatAccumulator`, `FeatureCostChart`, `EisenhowerMatrix`, `ItselfTest`, `OccupancyGridLsp`, `PipelineRunner`, `MessageQueueStepper`.
- `src/lib/softwareEngineering.ts`: float32 accumulation (via `Math.fround`), float32 spacing, the illustrative cost curve, the itself-test data, the pipeline run and the queue frames.
- `Quiz` questions can now carry a `figure` (a diagram shown under the prompt). Nothing else in `Quiz` changed.
- Course icon (three stacked layers), prerequisites (Data Structures, Operating Systems, Computer Networks), README row.
- `src/test/advanced-software-engineering.test.tsx`: renders all 24 lessons; checks the lecture labels, that every lecture ends with a practice lesson with both question sections and the "no past exams" note, that every `<Term>`/`<KeyTerms>` id exists, that every question has an explanation, that every content lesson highlights terms and lists key terms, that no names, institutions or course codes appear, and the helper functions (float32 loss at 100000, the itself-test table, the pipeline, FIFO queue).

**Decisions:**
- **Lessons per lecture, practice at the end of each lecture.** The request's structure (content → key terms → visuals → MCQ → system/diagram questions → solutions) is met by: content lessons with highlighted terms, inline diagrams and a "Key terms" recap, then a practice lesson. Solutions are the per-question explanations (shown on answering), plus `ModelAnswer` for the written dilemmas.
- **Practice is marked as practice.** Every practice lesson starts with a callout saying the course has no past exams and that the questions were written from the lecture. The MCQ section is a scored `Quiz` (completes the lesson); the system/diagram section is a `practice` quiz (no score), under its own heading.
- **One glossary, many lessons.** Definitions live in one file so a term means the same everywhere, as the request asks.
- **Additions marked as additions.** Where the slides only ask a question ("Disadvantages? Cautions? Qualities?", "Using loops?", "Does the tier type matter?"), the lessons give an answer and say the lecture left it as a question. The climate-control allocation tab and the lollipop redraw say they are our own drawings.
- **Week 5's infographic** became its own lesson, "Ten Architecture Styles at a Glance", since it covers five styles the week 5 slides only list.

**Source errors and notes found so far:**
- Lecture 1: the PID incident is called "catastrophic cancellation (type truncation)". The effect described (a small number vanishing when added to a large one) is absorption/swamping; catastrophic cancellation is precision loss when subtracting nearly equal numbers. The lesson gives both names and explains.
- Lecture 1 and 2 headers carry two different course codes (CS325 and CS352). Neither appears in the lessons.
- Lecture 4: the ATIA-M decomposition slide labels an app "TDDT", the uses slide "TDDC". Kept as on each slide; to confirm in round 2.
- Lecture 4: the slide's own C&C example uses plain arrows and notes they should be lollipops; the lesson shows the corrected drawing.

**Found but not fixed:**
- Diagrams wider than the phone column scroll sideways inside their frame (the page itself doesn't overflow). Round 6 should lower the minimum width or simplify the widest diagrams.
- The topology diagram in m5-01 is built from tiny boxes; a dedicated small SVG would read better (round 6).
- The ATIA-M decomposition is drawn as a tree from the slide's nested packages; the full server-side Java module list (14 packages) is summarized in one box (round 2).
- No cross-course links yet (e.g. client-server to Operating Systems' "Communication in client-server systems", pipes to the Linux lab). Round 9.

**Checked:** `npm run lint` (0 errors; the 12 warnings are all pre-existing in `src/components/ui`), `npm run test` (all pass after the file rename below), `npm run build` (OG images and pages generated for every new lesson). In a browser at 390 px wide: eight lessons opened with no horizontal page overflow; a term popup opened on tap and stayed clear of the text; the DIP before/after tabs rendered.

**Not checked:** dark theme and reduced motion in the browser; keyboard-only use of the popups; every interactive demo by hand (only the popup and tabs were exercised).

**Note on file names:** lesson files must start `m<N>-<NN>-`; the lesson-link and preview tooling reads lesson slugs from that pattern. The first draft used `l<N>-` and failed the link test, so the files were renamed.

**Next:** round 2, source fidelity, one lecture at a time starting with L1.

### Round 2, source fidelity: L1 and L2

Checked Lecture 1 (13 slides) against m1-01 to m1-03, and Lecture 2 (37 slides) against m2-01 to m2-05, slide by slide from the text copies, with the diagram slides (L1 slide 10, L2 slides 7 and 28) checked as images.

**Already covered:** L1: course objectives and the prime directive; the scaling myth, "wait for GPT-N" and black-box fallacy; the SWE-bench case study with all three failures and the short-term-memory analogy; the harness's four mechanisms and architectural inversion; the moral (engine vs vehicle, three points, takeaway); the PID setting, the three voices, the setup slide's sequence diagram, the incident with its 12-hour run and 0.0000001 delta, and the typosquatting attack. L2: every slide, including the software crisis and Brooks, both complexities, the four properties, the continuum and Axiom I, the definition and architectural vs design details, the architect/developer figure, the three open questions, the house analogy, the economic goal, the clean-up-later fallacy, the two values, cost-friction, the Eisenhower matrix, Table 1, the 4D model, all eight expectations and the compliance imperative, Pets.com and the 2002 data center, depth vs breadth and the knowledge pyramid, process vs practices, both laws with corollaries and examples, the circle of life, the four hands-on strategies, the ML paradigm shift, the definition, when to use and the five reasons not to, the four pillars, Table 2, the three dilemmas with their numbers, and the summary.

**Changed:**
- m1-01: SWE-bench described as on the slide ("500 complex engineering tasks"), dropping a detail the slide doesn't give; the slide's terms *context garbage collection* and *bounded contexts* now appear, each explained; added the lecture's readings.
- m2-01: the answers to the three open questions are labelled as ours, not the slides'.
- m2-04: the dilemma model answers are labelled as written for this course; added the lecture's readings.

**Source errors:** none new beyond round 1's (the "catastrophic cancellation" name, and the two course codes in the headers).

**Left out on purpose:** the bibliography slide (a reference list); the lessons cite the per-lecture readings instead. L1 slide 13 is blank.

**Not checked:** no browser check (text-only changes).

### Round 2, source fidelity: L3

Checked Lecture 3 (61 slides, SOLID applied to automotive software) against m3-01 to m3-06.

**Already covered:** the definition of a design principle, the four automotive challenges, the OO recap table and the SOLID table; SRP's two quotes, the super-ECU metaphor, the actor table and refined definition, the itself test with all seven FrontCamera methods and the "context matters" notes, the refactored classes, methods with parameters, the FFI benefit, the MediaLibrary before/smells/after/gains and the refactoring axiom; OCP's feature manager, impact table, refactoring, gains table, pragmatic reality, routing strategies and the inheritance-vs-delegation table; LSP's two statements, contracts table, contract rule, OccupancyGrid3D, the path planner, both "what went wrong" tables, the axiom, both fix steps, the gains table, the conservative default, the three relationships and decision matrix with the golden rule; ISP's fat-vs-segregated table, VehicleOperator, the forced dummies, the client table and hazards, the four interfaces, the focused operators and clients, the gains table and the Level 3 handover; DIP's statement, the traditional-vs-inverted table, the supplier-coupled fusion code and impact table, the three fix steps, the inverted-dependency diagram, the inversion-vs-injection distinction; all three dilemmas and the summary.

**Changed:**
- m3-05: added the slide's "what we gained" table as a static table (the interactive change-impact explorer stays, but revision needs the table too); added the lecture's readings.
- Dilemma 1 (SRP vs. latency) moved from m3-05 to the end of m3-01, so each dilemma sits with the principle it tests (SRP, LSP, ISP+DIP).
- m3-01, m3-03, m3-05: each dilemma is labelled as one of the lecture's "Think & Defend" questions, with the model answer marked as written for this course.

**Source errors:** none found in the code or tables. Two names are simplified on purpose: the slide's DIP diagram stereotypes («Core Policy», «SIL Benchmark», «Radar», «Camera») appear as «core policy» and «SIL»; the radar/camera stereotypes are left off to fit phone width.

**Left out on purpose:** the credits line naming the authors of the original slides (no people's names in lessons).

**Not checked:** no browser check (text and table changes only).
