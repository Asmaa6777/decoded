import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import mdx from "@mdx-js/rollup";
import type { Plugin } from "vite";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeLeadIn from "./src/lib/rehypeLeadIn";
import rehypeKatexHtml from "./src/lib/rehypeKatexHtml";

/** The MDX compiler, except for `?raw` imports: those load a lesson's source text
 *  (for link previews), and @mdx-js/rollup would otherwise strip the query and compile it. */
function mdxExceptRaw(options: Parameters<typeof mdx>[0]): Plugin {
  const plugin = mdx(options) as Plugin;
  const transform = plugin.transform as (this: unknown, code: string, id: string) => ReturnType<Extract<Plugin["transform"], (...a: never[]) => unknown>>;
  return {
    ...plugin,
    enforce: "pre",
    transform(code, id) {
      return id.includes("?raw") ? undefined : transform.call(this, code, id);
    },
  };
}

/** Fonts on screen before any scrolling: the hero heading, body text, and the mono header. */
const PRELOAD_FONTS = ["syne-latin-800-normal", "lora-latin-400-normal", "ibm-plex-mono-latin-400-normal"];

/** Adds <link rel="preload"> for PRELOAD_FONTS, so they download alongside the CSS
 *  instead of after it. Build only: the files' hashed names exist once bundled. */
function preloadFonts(): Plugin {
  return {
    name: "preload-fonts",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {});
        return PRELOAD_FONTS.map((name) => {
          const file = files.find((f) => f.startsWith(`assets/${name}-`) && f.endsWith(".woff2"));
          if (!file) throw new Error(`preloadFonts: no bundled file for ${name}`);
          return {
            tag: "link",
            attrs: { rel: "preload", href: `/${file}`, as: "font", type: "font/woff2", crossorigin: "" },
            injectTo: "head" as const,
          };
        });
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    mdxExceptRaw({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [
        // ids on headings, used by the lesson contents sidebar and deep links.
        // Before KaTeX, so "## Where $n \log n$ comes from" gets
        // where-n-log-n-comes-from, the same id vitest.config.ts produces.
        rehypeSlug,
        rehypeKatex,
        // class="lead-in" on a paragraph's leading bold label, coloured by the lesson CSS
        rehypeLeadIn,
        // each formula as one prebuilt HTML string rather than hundreds of JSX calls
        rehypeKatexHtml,
        // Shiki highlighting at build time. Only fences with a language
        // (```java, ```ts) get colours; bare fences stay plain for pseudocode.
        [rehypePrettyCode, { theme: "github-dark-dimmed", keepBackground: false }],
      ],
    }),
    react(),
    preloadFonts(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    reportCompressedSize: false,
    sourcemap: false,
    rollupOptions: {
      cache: false,
      maxParallelFileOps: 16,
    },
  },
}));
