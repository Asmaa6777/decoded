# Decoded — Brand Guide

A reference for keeping the look and feel of Decoded consistent across pages, marketing copy, social posts, and AI-generated content. Hand this file to any LLM (or human) producing that content and tell them to match it.

> [!IMPORTANT]
> The rules for writing lessons (voice, plain language, lesson structure, callouts, visuals and links) live in [writing-lessons.md](writing-lessons.md). This file covers the visual identity and marketing copy.

---

## 1. Brand essence

Decoded is a **magazine-meets-terminal** for computer science. It treats CS theory the way a serious editorial publication treats a long-form essay — clean typography, generous space, confident voice — but borrows the visual cues of a working developer environment (monospace labels, sharp corners, neon accent, grid texture).

The site exists to close a single gap: **abstract proofs you learn in class → the actual tools they power in production**. Every piece of content should serve that bridge in some way. If a sentence doesn't help a reader connect theory to a real-world tool, technique, or instinct, it doesn't belong.

The reader is a CS student or self-taught engineer who is smart, impatient, and tired of being told that "this will matter someday." Talk to them like a peer who has already crossed the bridge.

---

## 2. Voice and tone

The voice everywhere, and the words to avoid, are in [writing-lessons.md](writing-lessons.md#voice). Lessons follow that file. Marketing copy uses the same voice with a sharper tone:

- **Landing and marketing:** declarative, near-manifesto. Short lines. Italic for the philosophical aside ("Theory without tools is boring. Tools without theory are fragile.").
- No fake humility ("I'm just a small site…") and no chest-thumping ("the world's best CS course").

---

## 3. Typography

Three fonts. Each has one job. Never use a font for the wrong job.

| Font            | Role             | When to use                                                    | CSS variable        |
| --------------- | ---------------- | -------------------------------------------------------------- | ------------------- |
| **Syne**        | Display          | Headlines, course titles, lesson H1/H2/H3, big numbers         | `--font-display`    |
| **IBM Plex Mono** | Technical / Label | Eyebrows, nav, button text, code, tags, metadata, durations | `--font-mono`       |
| **Lora**        | Body / Reading   | Lesson prose, marketing paragraphs, callout body, descriptions | `--font-body`       |

### Typographic patterns

- **Eyebrow:** uppercase, monospace, `tracking-[0.2em]`, 11px, muted color. Sits above a section heading to label *what kind of thing this is*. Examples: `THE PEOPLE`, `OUR ORIGIN`, `TRACKS`, `CS THEORY · IN DEPTH, CONNECTED`.
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

What each lesson component (callout tones, `<PracticalApplication>`, quizzes) is for is in [writing-lessons.md](writing-lessons.md#callouts-and-components). `<Pillar>` is marketing-side: three-up structural concepts on a landing or teaser surface, not for lessons.

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

### Eyebrows (mono, uppercase, tracked)

Two to five words. State *what kind of thing follows*. Examples:

- `CS THEORY · IN DEPTH, CONNECTED`
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
- [ ] No emojis, no rounded pills, no drop shadows
- [ ] Borders not fills for surfaces; cards have sharp corners
- [ ] Accent color belongs to the right emotional register (see §4)
- [ ] Copy follows the voice and the "Never" list in [writing-lessons.md](writing-lessons.md)
- [ ] A lesson also passes the checklist in [writing-lessons.md](writing-lessons.md#checklist)

---

## 9. Prompt block for other LLMs

Paste this verbatim into the system prompt of any model you ask to write Decoded content:

> You are writing for **Decoded**, an editorial site that decodes computer science theory into the real-world tools it powers. Match this voice: declarative, second-person, plain language explaining hard ideas, occasionally dry. Treat the reader as a smart peer, not a beginner.
>
> If you are writing a lesson, follow docs/writing-lessons.md for the words, structure and components. Bridge every concept to a real production tool (regex engines, parsers, CPUs, schedulers, etc.) at least once.
>
> Use three fonts via CSS classes: `font-display` (Syne) for headings, `font-mono` (IBM Plex Mono) for eyebrows/labels/buttons/code, `font-body` (Lora) for prose. Eyebrows are uppercase, monospace, wide-tracked, 2–5 words, used to label what kind of section follows.
>
> Only five accent colors exist: neon (`#e8ff47`, the spark / primary), orange (`#ff6b35`, warning / friction), sky (`#7eb8ff`, theoretical / calm), violet (`#b47fff`, reflective / motivation), mint (`#47ffcc`, resolution / summary). Never invent a sixth. Use one accent word per headline at most.
>
> Never use: emojis, rounded pills, drop shadows, hedging language (*perhaps, somewhat, you could say*), AI-flavored words (*delve, robust, seamless, leverage, navigate the world of*), em-dashes as connectors, exclamation marks for energy, or "in today's fast-paced world"–style intros.
