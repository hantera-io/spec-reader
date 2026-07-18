#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { statSync } from "node:fs";
import { createServer } from "vite";
import open from "open";
import defineSpecReaderConfig from "../vite.config.js";

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));

function resolveTarget() {
  const arg = process.argv[2];
  const target = resolve(process.cwd(), arg ?? ".");

  let stats;
  try {
    stats = statSync(target);
  } catch {
    console.error(`spec-reader: path not found: ${target}`);
    process.exit(1);
  }

  if (stats.isFile()) {
    if (!target.toLowerCase().endsWith(".md")) {
      console.error(`spec-reader: not a markdown file: ${target}`);
      process.exit(1);
    }
    return { target, mode: "file", contentRoot: dirname(target) };
  }

  return { target, mode: "folder", contentRoot: target };
}

async function main() {
  const { target, mode, contentRoot } = resolveTarget();

  const server = await createServer({
    ...defineSpecReaderConfig({ target, mode, contentRoot }),
    configFile: false,
    server: {
      open: false,
    },
  });

  await server.listen();

  const info = server.config.server;
  const port = server.httpServer.address().port;
  const protocol = info.https ? "https" : "http";
  const url = `${protocol}://localhost:${port}/`;

  const label = mode === "file" ? "file" : "folder";
  console.log(`\n  spec-reader (${label} mode)`);
  console.log(`  ${target}`);
  console.log(`  ${url}\n`);

  await open(url);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
