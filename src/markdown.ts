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

      if (language === "mermaid") {
        return `<div class="mermaid">${escapeHtml(code)}</div>`;
      }

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

  return md;
}

export async function renderMarkdown(source: string): Promise<string> {
  const instance = await getMarkdownIt();
  return instance.render(source);
}
