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
  layout engine by default, re-theming with the app. Click a diagram to open
  it full screen with zoom (wheel or +/−) and drag-to-pan; close with ✕ or
  Esc.

- **Syntax highlighting** — powered by [Shiki](https://shiki.style). Common
  languages are bundled, plus the Filtrera grammar for ` ```filtrera ` blocks.
- **In-app navigation** — relative `.md` links resolve and navigate without a
  full reload. The open file is reflected in the URL hash, so links are
  shareable and refresh-safe.
- **Hot reload** — file changes push over Vite's websocket; the tree refreshes
  on add/remove, the current document refreshes on change.
- **Collapsed tree** — folders start collapsed and the tree auto-expands to
  reveal the open document. Expansion is remembered per content root in
  `sessionStorage`, so two spec-readers on different folders never share tree
  state.

## How it works

- The `sr` CLI resolves the target path, detects file vs folder mode, and boots
  a Vite dev server rooted at the package.
- A small Vite plugin exposes a content API (`/api/config`, `/api/tree`,
  `/api/file`) over the dev server's middleware and watches the content
  directory with chokidar for HMR.
- A Vue frontend renders the tree and the markdown document.

## Releasing

1. Bump `version` in `package.json` (for example `1.0.0`).
2. Commit the change and tag it: `git tag v1.0.0` — the tag must match the
   `package.json` version exactly.
3. Push with `git push origin main --tags`.

Pushing a `vX.Y.Z` tag triggers
[`.github/workflows/publish-npm.yml`](.github/workflows/publish-npm.yml), which
installs dependencies, verifies the package, and publishes
`@hantera/spec-reader` to
[npm](https://www.npmjs.com/package/@hantera/spec-reader) using the `NPM_TOKEN`
repository secret. Tags that are not strict `vX.Y.Z` (such as `v1.0` or
`v1.0.0-beta.1`) are ignored.

## License

[Apache 2.0](LICENSE)
