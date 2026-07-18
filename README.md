# spec-reader (`sr`)

A dead-simple markdown spec reader. Point it at a folder or a file and it opens
a clean, GitHub-style reader in your browser with light/dark theme, Mermaid
diagrams, and syntax highlighting — including the **Filtrera** language.

It always runs a Vite dev server, so edits to your markdown hot-reload
instantly. It never builds static output.

## Install

Requires Node.js >= 22.

```
npm install -g @hantera/spec-reader
```

or with yarn:

```
yarn global add @hantera/spec-reader
```

This registers the `sr` command globally.

## Usage

```
sr                      # folder mode, current directory
sr specs/apps/returns   # folder mode, a specific directory
sr specs/egresses.md    # single-file mode
```

- **No path** → the current directory in folder mode.
- **A directory** → folder mode with a file tree on the left.
- **A `.md` file** → single-file mode, just that document.

The browser opens automatically. Edit any markdown file and the view updates
live.

## Features

- **Light/dark theme** — follows your OS preference, with a toggle that persists
  to `localStorage`.
- **Markdown** — headings with anchor links, tables, blockquotes, task lists.
- **Mermaid** — ` ```mermaid ` fenced blocks render as diagrams using the **ELK**
  layout engine by default, re-theming with the app. Hover a diagram and click
  the ⛶ button to open it full screen with zoom (wheel or +/−) and drag-to-pan;
  close with ✕ or Esc.

- **Syntax highlighting** — powered by [Shiki](https://shiki.style). Common
  languages are bundled, plus the Filtrera grammar for ` ```filtrera ` blocks.
- **In-app navigation** — relative `.md` links resolve and navigate without a
  full reload. The open file is reflected in the URL hash, so links are
  shareable and refresh-safe.
- **Hot reload** — file changes push over Vite's websocket; the tree refreshes
  on add/remove, the current document refreshes on change.

## How it works

- The `sr` CLI resolves the target path, detects file vs folder mode, and boots
  a Vite dev server rooted at the package.
- A small Vite plugin exposes a content API (`/api/config`, `/api/tree`,
  `/api/file`) over the dev server's middleware and watches the content
  directory with chokidar for HMR.
- A Vue frontend renders the tree and the markdown document.

## License

[Apache 2.0](LICENSE)
