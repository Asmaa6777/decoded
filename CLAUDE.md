# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CSDecoded is a client-side educational site that maps abstract CS theory to the real tools it powers (e.g. finite automata → regex engines). It is content-first: courses and lessons are authored as MDX and rendered by a small React/Vite app. There is no backend.

## Commands

```bash
npm run dev          # Vite dev server on http://localhost:8080
npm run build        # production build
npm run build:dev    # build in development mode (unminified, source maps)
npm run lint         # eslint over the repo
npm run preview      # serve the production build
npm run test         # vitest run (one-shot)
npm run test:watch   # vitest in watch mode
```

`bun` works in place of `npm` for any of the above (the repo ships both `bun.lockb` and `package-lock.json`).

Run a single test file or pattern:
```bash
npx vitest run src/test/example.test.ts
npx vitest run -t "name of test"
```

## Architecture

### Content registry is the single source of truth
`src/content/registry.ts` defines the entire course catalog as a typed `courses: Course[]` array (`Course` → `Module[]` → `Lesson[]`). Each MDX lesson is **eagerly imported** at the top of this file and attached to its lesson as `Component`, so lessons render synchronously with no lazy/Suspense boundary. Helper functions (`getCourse`, `getLesson`, `lessonNeighbors`, `flattenLessons`) are how every page looks content up — pages never import MDX directly.

**To add a lesson:** create the `.mdx` file under `src/content/<course-slug>/NN-slug.mdx`, then import it in `registry.ts` and add a `{ slug, title, duration, Component }` entry to the right module. The `NN-` numeric prefix orders files on disk only; ordering at runtime comes from array position. Lesson `slug` must be kebab-case and is what appears in the URL.

A course with `status: "coming-soon"` typically has empty `modules: []` and is rendered as a teaser; `status: "available"` courses have real lessons.

### Routing and rendering flow
`src/App.tsx` wires global providers (React Query, `ThemeProvider`, tooltip, toasters) and four routes via React Router:
`/` (Index) → `/courses` (Courses) → `/courses/:courseSlug` (CoursePage) → `/courses/:courseSlug/:lessonSlug` (LessonPage).

`LessonPage` pulls the lesson from the registry, renders `<lesson.Component />` inside a Tailwind Typography `prose` article, and builds prev/next navigation from `lessonNeighbors`.

### MDX components are imported, not provided
MDX is compiled by `@mdx-js/rollup` (configured `enforce: "pre"` in `vite.config.ts`). Although `providerImportSource: "@mdx-js/react"` is set, **there is no `MDXProvider` wrapping the app** — custom components (`Callout`, `PracticalApplication`, `Pillar`, `ApplicationsGrid` in `src/components/mdx/MdxComponents.tsx`) must be explicitly `import`ed at the top of each `.mdx` file that uses them. Plain markdown elements get their styling from the `prose` classes, not from mapped components.

### Design tokens
Five brand accent colors — `neon`, `orange`, `sky`, `violet`, `mint` — are the only accents in use. They are defined as CSS variables (`src/index.css`), exposed as Tailwind colors (`tailwind.config.ts`), and referenced two ways: a course's `accent` field in the registry, and the `tone` prop on MDX components (which maps through `toneMap`). Use only these five. Fonts: Syne (`font-display`), IBM Plex Mono (`font-mono`), Lora (`font-body`), loaded via Google Fonts in `index.html`.

### Progress tracking
`src/hooks/useProgress.ts` persists per-course completed-lesson slugs to `localStorage` under key `decoded:progress:v1`. It syncs across mounted components by dispatching/listening for a custom `decoded:progress` window event (plus the native `storage` event for cross-tab). No server involvement.

## Conventions and gotchas

- **Subpath deployment:** the app is served under `/csdecoded`. This is hardcoded in two places that must stay in sync — `base: "/csdecoded/"` in `vite.config.ts` and `basename="/csdecoded"` on `BrowserRouter` in `App.tsx`.
- Import from `src/` via the `@/*` alias (configured in both `vite.config.ts` and `vitest.config.ts`).
- `src/components/ui/**` is shadcn/ui (config in `components.json`, base color slate, no prefix). Treat these as generated primitives; project-specific UI lives in `src/components/` and `src/components/layout/`.
- TypeScript runs in loose mode (`tsconfig.app.json`) — `noImplicitAny`, `strictNullChecks`, and unused-var checks are off.
- Tests use Vitest + jsdom + Testing Library; `src/test/setup.ts` mocks `matchMedia`. Matched by `src/**/*.{test,spec}.{ts,tsx}`.
