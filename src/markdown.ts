import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import grafiq from "@grafiq/markdown-it";
import { createHighlighter, type Highlighter } from "shiki";
import filtreraGrammar from "./grammars/filtrera.tmLanguage.json";

const BUNDLED_LANGS = [
  "typescript",
  "javascript",
  "json",
  "yaml",
  "bash",
  "shell",
  "csharp",
  "sql",
  "html",
  "css",
  "xml",
  "markdown",
  "python",
  "go",
  "rust",
  "graphql",
  "docker",
  "ini",
  "toml",
  "diff",
];

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [...BUNDLED_LANGS, filtreraGrammar as never],
    });
  }
  return highlighterPromise;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let md: MarkdownIt | null = null;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

async function getMarkdownIt(): Promise<MarkdownIt> {
  if (md) return md;

  const highlighter = await getHighlighter();
  const loaded = new Set(highlighter.getLoadedLanguages());

  md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(code, lang) {
      const language = (lang || "").toLowerCase();
      const effective = loaded.has(language) ? language : "text";
      if (effective === "text") {
        return `<pre class="shiki-plain"><code>${escapeHtml(code)}</code></pre>`;
      }

      return highlighter.codeToHtml(code, {
        lang: effective,
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      });
    },
  })
    .use(anchor, {
      slugify,
      permalink: anchor.permalink.headerLink(),
    })
    .use(grafiq);

  // Mermaid fences must render as a bare `<div class="mermaid">` host, without
  // the `<pre><code class="language-mermaid">` wrapper the default fence rule
  // puts around non-`<pre>` highlight output — that wrapper double-frames the
  // diagram. Render mermaid ourselves and chain every other fence language to
  // the previous rule (the grafiq plugin's wrapper, which falls back to the
  // default rule and the Shiki highlight). This must be installed after
  // `.use(grafiq)` so it takes precedence.
  const previousFence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const language = (token.info || "").trim().split(/\s+/)[0].toLowerCase();
    if (language === "mermaid") {
      return `<div class="mermaid">${escapeHtml(token.content)}</div>\n`;
    }
    return previousFence(tokens, idx, options, env, self);
  };

  return md;
}

export async function renderMarkdown(source: string): Promise<string> {
  const instance = await getMarkdownIt();
  return instance.render(source);
}
