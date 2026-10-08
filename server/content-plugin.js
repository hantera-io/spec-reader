import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, resolve, sep, basename } from "node:path";
import chokidar from "chokidar";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".svn",
  "dist",
  "bin",
  "obj",
]);

function isMarkdown(name) {
  return name.toLowerCase().endsWith(".md");
}

function toPosix(p) {
  return p.split(sep).join("/");
}

function isInside(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !resolve(rel).includes(".."));
}

async function buildTree(dir, root) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nodes = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      const childPath = join(dir, entry.name);
      const children = await buildTree(childPath, root);
      if (children.length > 0) {
        nodes.push({
          type: "dir",
          name: entry.name,
          path: toPosix(relative(root, childPath)),
          children,
        });
      }
    } else if (entry.isFile() && isMarkdown(entry.name)) {
      const filePath = join(dir, entry.name);
      nodes.push({
        type: "file",
        name: entry.name,
        path: toPosix(relative(root, filePath)),
      });
    }
  }

  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    const aReadme = a.name.toLowerCase() === "readme.md";
    const bReadme = b.name.toLowerCase() === "readme.md";
    if (aReadme !== bReadme) return aReadme ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

  return nodes;
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

export function contentPlugin({ target, mode, contentRoot }) {
  const root = resolve(contentRoot);

  return {
    name: "spec-reader-content",
    configureServer(server) {
      server.middlewares.use("/api/config", (req, res) => {
        sendJson(res, 200, {
          mode,
          rootName: basename(root),
          // Absolute posix path of the content root. Used by the frontend to
          // scope persisted UI state (e.g. tree expansion) per root folder.
          rootPath: toPosix(root),
          file: mode === "file" ? toPosix(relative(root, resolve(target))) : null,
        });
      });

      server.middlewares.use("/api/tree", async (req, res) => {
        try {
          const tree = await buildTree(root, root);
          sendJson(res, 200, { tree });
        } catch (error) {
          sendJson(res, 500, { error: String(error) });
        }
      });

      server.middlewares.use("/api/file", async (req, res) => {
        try {
          const url = new URL(req.url, "http://localhost");
          const rel = url.searchParams.get("path") ?? "";
          const absolute = resolve(root, rel);

          if (!isInside(root, absolute)) {
            sendJson(res, 403, { error: "Path outside of content root" });
            return;
          }

          const stats = await stat(absolute);
          if (!stats.isFile() || !isMarkdown(absolute)) {
            sendJson(res, 404, { error: "Not a markdown file" });
            return;
          }

          const content = await readFile(absolute, "utf8");
          sendJson(res, 200, { path: toPosix(relative(root, absolute)), content });
        } catch {
          sendJson(res, 404, { error: "File not found" });
        }
      });

      const watcher = chokidar.watch(root, {
        ignored: (p) => {
          const name = basename(p);
          return IGNORED_DIRS.has(name);
        },
        ignoreInitial: true,
        depth: mode === "file" ? 0 : 20,
      });

      const notify = (event, filePath) => {
        if (!isMarkdown(filePath)) return;
        server.ws.send({
          type: "custom",
          event: "spec-reader:change",
          data: {
            kind: event,
            path: toPosix(relative(root, filePath)),
          },
        });
      };

      watcher.on("change", (p) => notify("change", p));
      watcher.on("add", (p) => notify("add", p));
      watcher.on("unlink", (p) => notify("unlink", p));

      server.httpServer?.on("close", () => watcher.close());
    },
  };
}
