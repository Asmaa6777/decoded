# Decoded — Brand Guide

A reference for keeping the look, voice, and feel of CSDecoded consistent across new lessons, marketing copy, social posts, and AI-generated content. Hand this file to any LLM (or human) producing content for the site and tell them to match it.

---

## 1. Brand essence

CSDecoded is a **magazine-meets-terminal** for computer science. It treats CS theory the way a serious editorial publication treats a long-form essay — clean typography, generous space, confident voice — but borrows the visual cues of a working developer environment (monospace labels, sharp corners, neon accent, grid texture).

The site exists to close a single gap: **abstract proofs you learn in class → the actual tools they power in production**. Every piece of content should serve that bridge in some way. If a sentence doesn't help a reader connect theory to a real-world tool, technique, or instinct, it doesn't belong.

The reader is a CS student or self-taught engineer who is smart, impatient, and tired of being told that "this will matter someday." Talk to them like a peer who has already crossed the bridge.

---

## 2. Voice and tone

### Voice (always)

- **Declarative, not hedged.** "An alphabet is a finite, non-empty set of symbols. That is the entire definition. Nothing more." Don't pad with *perhaps, somewhat, you could say.*
- **Second-person, conversational.** "You will see it everywhere." "Get these right and the rest of the course has a foundation."
- **Plain language explaining hard ideas.** A reader without the jargon should still feel the shape of the concept. Introduce notation only after you've explained what it does in English.
- **Calls out the trap.** When something is commonly misunderstood, name the misunderstanding directly. "The empty string ε is not the empty set ∅." This is a recurring move — the *gotcha callout*.
- **Bridges to the real world.** Where a concept maps to a tool (regex, parsers, CPUs, antivirus, routing, schedulers), name that tool. The mapping is the product.

### Tone shifts

- **Lessons:** measured, didactic, occasionally dry-funny. Like a good professor who respects your time.
- **Landing / marketing:** sharper, more declarative, near-manifesto. Short lines. Italic for the philosophical aside ("Theory without tools is boring. Tools without theory are fragile.").
- **Callouts:** punchy. One idea per callout, framed as warning, insight, or "what you just built."

### Tone red lines (never)

- No "hey there!", emojis, exclamation marks for energy, or hustle-speak.
- No corporate-edu padding: *In today's fast-paced world…*, *industry-leading*, *cutting-edge*, *unlock your potential*.
- No fake humility ("I'm just a small site…") and no chest-thumping ("the world's best CS course").
- No AI-tells: tricolons of fluff, *delve into*, *robust*, *seamless*, *leveraging*, *it's important to note that*.
- No emojis in body copy (the design uses typography for emphasis, not pictograms).

---

## 3. Typography

Three fonts. Each has one job. Never use a font for the wrong job.

| Font            | Role             | When to use                                                    | CSS variable        |
| --------------- | ---------------- | -------------------------------------------------------------- | ------------------- |
| **Syne**        | Display          | Headlines, course titles, lesson H1/H2/H3, big numbers         | `--font-display`    |
| **IBM Plex Mono** | Technical / Label | Eyebrows, nav, button text, code, tags, metadata, durations | `--font-mono`       |
| **Lora**        | Body / Reading   | Lesson prose, marketing paragraphs, callout body, descriptions | `--font-body`       |

### Typographic patterns

- **Eyebrow:** uppercase, monospace, `tracking-[0.2em]`, 11px, muted color. Sits above a section heading to label *what kind of thing this is*. Examples: `THE PEOPLE`, `OUR ORIGIN`, `TRACKS`, `CS THEORY · REAL-WORLD SKILLS MAPPED`.
- **Display headings:** Syne, font-weight 700–800, tight tracking (`-0.01em`), short. Avoid headlines longer than two lines. Lowercase the word in the accent color when one phrase is being highlighted (e.g. "Computer science Proofs, **decoded** to production tools" — `decoded` is the neon word).
- **Body:** Lora 18px, line-height 1.75. Generous. Never tighten this — readability is load-bearing.
- **Mono for metadata:** anything that is *data about* the content (duration, version, status, route, tag) is monospace, 10–12px, uppercase, wide tracking. This is the "terminal" half of the aesthetic.

---

## 4. Color system

There are exactly **five brand accents**. Adding a sixth dilutes the brand. They map onto a deliberate emotional spectrum.

| Token        | Hex       | Feel                                       | Use for                                                  |
| ------------ | --------- | ------------------------------------------ | -------------------------------------------------------- |
| `--neon`     | `#e8ff47` | Electric, alive, "the spark"               | Primary accent. The "decoded" word. Active links. The first/flagship course. |
| `--orange`   | `#ff6b35` | Warning, friction, attention               | The "watch out" callout. Underline color for inline links in light mode. Second course / warm course. |
| `--sky`      | `#7eb8ff` | Calm, structural, theoretical              | Algorithm / theory courses. Neutral diagrams.            |
| `--violet`   | `#b47fff` | Reflective, "why this exists"              | OS-level / systems courses. Meta callouts that explain motivation. |
| `--mint`     | `#47ffcc` | Resolution, summary, "what you just built" | Distributed systems course. The closing/recap callout.   |

### Modes

The site runs two reading surfaces:

- **Light (reading mode):** warm paper `#faf8f3`, near-ink text `hsl(222 25% 12%)`. This is where lessons live. Feel: a printed CS book on cream paper.
- **Dark (editorial mode):** deep navy-black `#0a0a0f`, off-white text. This is where the landing/hero lives. Feel: a 2 AM terminal, a music magazine cover, a hacker poster.

Both modes use the same five accents — the accent palette does not shift with theme. The accents stay vivid because they sit on either ink or near-black; never mute them.

### Other usage rules

- **No gradients** beyond extremely subtle ones (the grid-noise texture overlay is the only background "treatment").
- **No drop shadows.** Borders only.
- **Border radius: 0.25rem max** (`--radius`). The brand is sharp-cornered. Avoid pills, fully rounded buttons, and circular cards (except for avatars).
- **Borders, not fills, for surfaces.** Cards usually have `border + bg-muted/5`, never a solid colored fill. Color is reserved for accent moments.

---

## 5. Visual signatures

These are the recurring visual moves that make something "feel like Decoded":

1. **Grid-noise texture overlay.** A faint neon grid (`grid-noise` utility in `src/index.css`) sits behind hero areas. It's the only ambient texture. Pages without it feel sterile; over-using it feels busy. Use once per page, fixed position.
2. **The eyebrow → heading → body stack.** Every section opens with a mono eyebrow tag, then a Syne display heading, then Lora body. Don't break the rhythm.
3. **Accent-word highlighting.** In big headlines, one word is colored in `--neon` (rarely `--orange`). One word, not three.
4. **Sharp rectangles.** Cards, buttons, callouts, code blocks — all sharp-cornered (or 0.25rem). Avoid Material/iOS roundness.
5. **Monospace `→` arrows.** Buttons and links use a literal arrow character (`→`) in mono, not an SVG chevron.
6. **Tone-colored vertical bars / left borders.** Callouts use a left border in their tone color. Lesson blockquotes use a 3px orange left border.

---

## 6. Component voice

Each in-MDX component carries a specific meaning. Don't use them interchangeably.

- **`<Callout tone="orange">`** — "Don't fall into this trap." A misconception, a common mistake, a gotcha. The reader is about to get something wrong; correct them before they do.
- **`<Callout tone="violet">`** — "Why this exists / why mathematicians chose this." Meta-commentary that gives motivation behind a definition. Reflective.
- **`<Callout tone="mint">`** — "What you just built." Summary at the end of a section or lesson. Reassuring, validating.
- **`<Callout tone="neon">`** — Reserve for the rare exciting "this is the key insight" moment. Use sparingly; over-use drains its power.
- **`<Callout tone="sky">`** — Theory-side context, formal note, or "the math view."
- **`<PracticalApplication>` / `<ApplicationsGrid>`** — The bridge to the outside world. Each card points to a real tool, real link, real video, or real exercise. No platitudes.
- **`<Pillar>`** — Marketing-side. Three-up structural concepts on a landing/teaser surface. Not for lessons.

---

## 7. Copy patterns

### Headlines (Syne, display)

Good:
- *Computer science Proofs, decoded to production tools*
- *Born from the frustration of "Magic Boxes"*
- *The Language of Languages*
- *Theory vs. Tools*

Bad (corporate-edu, AI-flavored):
- *Unlock the Power of CS Theory*
- *Master Computer Science with Our Cutting-Edge Platform*
- *Your Journey to Becoming a Better Engineer Starts Here*

### Lesson openings

Always anchor the lesson in the **historical or human problem** that made the concept necessary. Don't start with a definition.

Good:
> Before any machine, before any automaton, before any algorithm — mathematicians needed to agree on what they were even talking about. When Turing, Kleene, and Chomsky were building this field in the 1930s–50s, they kept running into the same problem: how do you precisely describe an infinite collection of strings using a finite set of rules?

Bad:
> A formal language is a set of strings over a finite alphabet. In this lesson, we will explore the foundational concepts…

### Definitions

When introducing notation, define it three ways in this order: **plain English → formal symbol → example.** Never symbol-first.

### Sentence rhythm

Mix short declarative sentences with one longer connective sentence. The short sentences are the rhythm; the long one is the explanation. Em-dashes are the preferred connector — not semicolons, not parentheses for asides.

### Eyebrows (mono, uppercase, tracked)

Two to five words. State *what kind of thing follows*. Examples:

- `CS THEORY · REAL-WORLD SKILLS MAPPED`
- `OUR ORIGIN`
- `THE PEOPLE`
- `TRACKS`
- `CORE PHILOSOPHY`

### Microcopy and buttons

Monospace, uppercase, tracked. Verb-led. End with `→` for forward actions.

- `START WITH THEORY OF COMPUTATION →`
- `BROWSE ALL TRACKS`
- `MARK AS COMPLETE`
- `BACK TO COURSE ←`

---

## 8. What "feels like Decoded" — a checklist

Before shipping a page, lesson, or piece of marketing copy, run through:

- [ ] One eyebrow per section, mono and uppercase
- [ ] Display heading in Syne, ≤ 2 lines
- [ ] If a word in the heading is highlighted, it's in `--neon` (and only one word)
- [ ] Body in Lora, generous line-height
- [ ] At least one moment that maps theory → a real production tool
- [ ] No emojis, no rounded pills, no drop shadows
- [ ] Borders not fills for surfaces; cards have sharp corners
- [ ] Accent color belongs to the right emotional register (see §4)
- [ ] No AI-flavored connective tissue (*delve, robust, seamless, leverage, it's important to note*)
- [ ] If a callout is used, its tone matches its purpose (§6)
- [ ] Lesson opening anchors in a human/historical problem, not a definition

---

## 9. Prompt block for other LLMs

Paste this verbatim into the system prompt of any model you ask to write Decoded content:

> You are writing for **CSDecoded**, an editorial site that decodes computer science theory into the real-world tools it powers. Match this voice: declarative, second-person, plain language explaining hard ideas, occasionally dry. Treat the reader as a smart peer, not a beginner.
>
> Open lessons with the historical or human problem that made the concept necessary — never with a definition. Bridge every concept to a real production tool (regex engines, parsers, CPUs, schedulers, etc.) at least once.
>
> Use three fonts via CSS classes: `font-display` (Syne) for headings, `font-mono` (IBM Plex Mono) for eyebrows/labels/buttons/code, `font-body` (Lora) for prose. Eyebrows are uppercase, monospace, wide-tracked, 2–5 words, used to label what kind of section follows.
>
> Only five accent colors exist: neon (`#e8ff47`, the spark / primary), orange (`#ff6b35`, warning / friction), sky (`#7eb8ff`, theoretical / calm), violet (`#b47fff`, reflective / motivation), mint (`#47ffcc`, resolution / summary). Never invent a sixth. Use one accent word per headline at most.
>
> Custom MDX components — `<Callout tone="...">`, `<PracticalApplication>`, `<ApplicationsGrid>`, `<Pillar>` — must be explicitly imported at the top of each `.mdx` file from `@/components/mdx/MdxComponents`. Use `Callout` with the tone that matches the purpose: orange = misconception, violet = motivation, mint = recap, sky = formal note, neon = key insight.
>
> Never use: emojis, rounded pills, drop shadows, hedging language (*perhaps, somewhat, you could say*), AI-flavored words (*delve, robust, seamless, leverage, navigate the world of*), exclamation marks for energy, or "in today's fast-paced world"–style intros.
>
> Sentence rhythm: short declarative sentences interleaved with one longer explanatory sentence. Em-dashes are the preferred connector. Define notation in this order: plain English → formal symbol → example.
