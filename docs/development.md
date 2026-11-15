# Development Guide

This document covers project setup, local development, and directory structure for the Decoded platform.

---

## Project Setup

### Prerequisites
- **Node.js** (v18+ recommended)
- **bun** (optional, for faster installs)

### Install Dependencies
You can use either `bun` or `npm`:

```bash
# Using bun (preferred)
bun install

# Or using npm
npm install
```

### Start the Development Server
```bash
# Using bun
bun run dev

# Or using npm
npm run dev
```
The app will be available at [http://localhost:8080](http://localhost:8080).

### Build for Production
```bash
bun run build
# Or
npm run build
```

### Preview Production Build
```bash
bun run preview
# Or
npm run preview
```

### Run Tests
```bash
bun run test
# Or
npm run test
```

---

## Directory Structure

```
src/
├── App.tsx            # Router + global providers
├── main.tsx           # React root
├── index.css          # Theme tokens, prose styles
│
├── pages/             # Page components (landing, courses, lessons)
├── content/           # Course and lesson content (MDX)
├── components/        # UI components and layout
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── test/              # Vitest setup and tests
```

---

## Key Configuration Files

| File                | Purpose                                      |
|---------------------|----------------------------------------------|
| vite.config.ts      | Vite config, MDX plugin, aliases, port       |
| tailwind.config.ts  | Tailwind config, fonts, accent colors        |
| tsconfig.app.json   | TypeScript config (loose mode)               |
| components.json     | shadcn/ui config                             |
| src/index.css       | Self-hosted Syne, IBM Plex Mono, Lora        |

---

## Conventions
- Use `@/*` path alias for imports from `src/`
- Lesson slugs: kebab-case, prefixed with order number in filename only
- Accent colors: use only the 5 defined tokens
- No backend code in the repo (fully client-side)

---

For more details, see the README or project files.
