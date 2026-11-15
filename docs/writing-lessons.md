# Writing Lessons

Every rule for the words, structure and components inside a Decoded lesson, in one place. Read it before you write or revise a lesson, and give it to any agent that does. [building-a-course.md](building-a-course.md) covers the process (sources, scope, registration, review rounds), and [brand.md](brand.md) covers the look of the site and its marketing copy.

## The reader

A CS student or self-taught engineer who is smart, short on time and tired of hearing that "this will matter someday". Many read English as a second language. Write for someone meeting the subject for the first time who has read only the earlier lessons.

## Voice

- **Say it plainly and with confidence.** "An alphabet is a finite, non-empty set of symbols. That is the entire definition." Don't hedge with *perhaps*, *somewhat* or *you could say*.
- **Talk to the reader as "you".** "You will see it everywhere." Treat them as a peer, not a beginner.
- **Measured, occasionally dry-funny.** Like a good teacher who respects your time.
- **Name the real tool.** Where an idea powers something real (regex engines, parsers, CPUs, schedulers, routers), say so. That link from theory to tool is what the site is for.

## Plain language

- Use the simplest word that is still accurate. Keep a technical term only when it is the right name, and explain it the first time it appears.
- Keep sentences short. Mix several short sentences with an occasional longer one that explains.
- Nothing should send a non-native English speaker to a dictionary twice. Avoid idioms, rare words and long chains of clauses.
- When the course's source material calls something by a different name, give both names.
- Run finished prose through the humanizer skill.

## Never

- Emojis, "hey there!", or exclamation marks for energy.
- Filler intros and sales talk: *In today's fast-paced world*, *cutting-edge*, *unlock your potential*, *in this lesson, we will explore*.
- AI tells: *delve*, *robust*, *seamless*, *leverage*, *it's important to note that*, lists of three added for rhythm, "not X but Y" contrasts, one-line dramatic closers.
- Em-dashes as connectors. Use a comma, a colon or a full stop instead.
- ASCII or text-art diagrams (circuits, waveforms, boxes drawn with `+--|` in code blocks). Draw them with a component instead; see [Visuals](#visuals).
- Promising a lesson that doesn't exist, such as "later in this course" for something no lesson covers.
- Copied passages from source material, or the name of any institution or teacher.

## Shape of a lesson

- **Open with the problem.** Start from something the reader already knows, or the problem that made the idea necessary. Never open with a definition. A line of history is fine when it *is* the problem; history for its own sake gets cut.
- **Define in three steps: plain words, then the symbol, then an example.** Never symbol first.
- **Bold a term where you define it**, as in "the **dot product** multiplies matching entries". Link previews look for that bold word (see [Linking between lessons](#linking-between-lessons)).
- **Define every term before you use it.** If a lesson uses a term another lesson defines, link it.
- **Work every example step by step.** Don't skip the step a student would get stuck on.
- **Name the usual mistake.** For each main idea, say what students typically get wrong, in an orange callout.
- **Weave applications into the explanation.** Where an idea shows up in machine learning, graphics or a real tool, say so where the idea is explained, not in a separate section at the end.
- **The `#` heading matches the lesson's `title` in the registry.**

## Callouts and components

Import every component at the top of the `.mdx` file from `@/components/mdx/MdxComponents` (there is no global provider). Each one has a job; don't swap them.

| Component | Use it for |
| --- | --- |
| `<Callout tone="orange">` | A trap: a common mistake or misconception, corrected before the reader makes it. |
| `<Callout tone="violet">` | Why this exists: the motivation behind a definition. |
| `<Callout tone="sky">` | The formal or math view of something just explained in plain words. |
| `<Callout tone="mint">` | What you just built: a recap at the end of a section or lesson. |
| `<Callout tone="neon">` | The one key insight. Rare; using it often drains it. |
| `<PracticalApplication>`, `<ApplicationsGrid>` | A real tool, link, video or exercise. No platitudes. |
| `<CodeTabs>` | Code in more than one language (see [Code](#code)). |
| `<Quiz>` | The graded quiz at the end of a module or course. |
| `<Quiz practice>` | Past-exam multiple choice inside a lesson. No score is saved. |
| `<ModelAnswer>` | A written exam question; the answer stays hidden behind a button. |

Callouts are short: one idea each. `<Pillar>` is for landing pages, not lessons.

Quiz explanations say why the right answer is right and why each wrong one is wrong, in plain words.

## Visuals

- When an idea is hard to picture, give the reader something to click, drag or step through. Put the logic in `src/lib/` with tests, and the interface in `src/components/mdx/<Topic>Visualizers.tsx`.
- Draw circuits with `CircuitDrawing` or `LiveCircuit` (`CircuitVisualizers.tsx`), waveforms with `TimingDiagram` (`LogicVisualizers.tsx`), and graphs and state machines with `Diagram` or `AutomatonDiagram`.
- If a visualizer already shows something, don't also describe the same picture in text next to it.
- Every visual works at phone width, in light and dark themes, and with reduced motion.

## Code

- Code in more than one language goes in one `<CodeTabs>`, with a fenced block per language and blank lines around each. The reader's choice of language is shared across the site.
- Put language notes in code comments, not in the prose around the block.
- Run every sample. In Python, `print(x)  # value` must print `value`; `python3 scripts/check-code-samples.py <files>` checks this, and runs MATLAB in Octave when it's installed.
- Computational Mathematics shows every example in MATLAB and Python; `src/test/computational-math.test.tsx` enforces it.

## Linking between lessons

**Whenever a lesson uses an idea it doesn't explain, link to the lesson that does.** A reader who meets "dot product" in the middle of convolution should be one click from the lesson that teaches it, not left to search.

- **Link the first use in each lesson.** One link per idea per lesson is enough. Link the words themselves, inside the sentence: "multiply the pairs and add, which is a [dot product](/courses/computational-mathematics/transpose-and-products#the-dot-product)". Avoid "see also" lists and bare "click here".
- **Link to the section, not just the lesson,** when the idea has its own heading. Headings get ids automatically: lowercase, spaces become hyphens and punctuation is dropped, so `## The dot product` becomes `#the-dot-product`.
- **Link across courses as well as within one.** XOR lives in Logic Design, Big-O in Algorithm Design and Analysis. Look in `src/content/` before you assume something isn't covered.
- **Link forward too.** If a lesson uses an idea before the lesson that teaches it, link ahead ("the [next lesson](...) is all about it") rather than leaving it unexplained.
- **If no lesson teaches it,** explain it in a sentence where it's used, or say plainly that it's outside this course.
- **Link back when you add a lesson.** Search the other courses for places that use your new lesson's ideas without explaining them, and link them to it.

Write links as ordinary markdown, `[words](/courses/<course>/<lesson>#<section>)`. The lesson page follows them without reloading the site.

**Hovering a link shows a preview** of how the linked lesson defines the idea, like a dictionary entry. The preview is read from the lesson itself: within the linked section (or the whole lesson, if the link has no section) it picks the paragraph where the link's words appear in **bold**, then one that mentions them, then the first paragraph. A paragraph ending in a colon brings along the formula or list after it. `src/test/lesson-preview.test.ts` checks that every link on the site produces a preview, and `src/test/lesson-links.test.ts` that every link points at a real lesson and heading, so a renamed lesson or heading fails the tests instead of leaving a dead link.

## Facts and sources

- Write in your own words. Never copy passages from slides or notes.
- Treat sources as possibly wrong. Recalculate every example and run every code sample. List the errors you correct in the pull request.
- Where the sources only list a topic without teaching it, use a standard textbook, and say which lessons you wrote that way.

## Checklist

- [ ] Opens with a problem or something familiar, not a definition
- [ ] Every term is defined in plain words, bolded where defined, before it's used
- [ ] Every example is worked step by step, and every code sample runs
- [ ] Each main idea names the usual mistake
- [ ] At least one real tool the idea powers is named
- [ ] Each callout's tone matches its job
- [ ] No ASCII diagrams, emojis, em-dashes or AI-tell words
- [ ] Every idea used but not taught links to the lesson that teaches it
- [ ] The prose has been through the humanizer
