import { ref, type InjectionKey } from "vue";

/**
 * Expansion state for the file tree.
 *
 * Directories are collapsed by default. Which folders are expanded is
 * remembered per content root: the state lives in `sessionStorage` under a
 * key derived from the root's absolute path, so two spec-reader instances
 * opened on different folders never mix their tree state.
 */
export interface TreeExpansionStore {
  /** Adopt a content root and load its persisted expansion set. */
  init(rootPath: string): void;
  /** Whether a directory is expanded. Directories default to collapsed. */
  isExpanded(dirPath: string): boolean;
  /** Toggle a directory, persisting the change. */
  toggle(dirPath: string): void;
  /** Expand every directory on the way to `filePath` (e.g. the open document). */
  revealPath(filePath: string): void;
}

/** Injection key used by App.vue to share one store with the whole tree. */
export const TREE_EXPANSION: InjectionKey<TreeExpansionStore> = Symbol("tree-expansion");

const STORAGE_PREFIX = "spec-reader";

function storageKey(rootPath: string): string {
  return `${STORAGE_PREFIX}:${rootPath}:expanded`;
}

/** Directory prefixes of a relative posix path: "a/b/c.md" → ["a", "a/b"]. */
function parentDirs(path: string): string[] {
  const parts = path.split("/");
  const dirs: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    dirs.push(parts.slice(0, i).join("/"));
  }
  return dirs;
}

function readPersisted(key: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((entry): entry is string => typeof entry === "string"));
      }
    }
  } catch {
    // Storage unavailable or corrupt — fall back to a fresh, memory-only set.
  }
  return new Set();
}

/**
 * Creates the shared tree-expansion store. Call `init` once the app config
 * (and thus the content root) is known, then provide it as TREE_EXPANSION.
 */
export function createTreeExpansionStore(): TreeExpansionStore {
  const rootPath = ref<string | null>(null);
  const expanded = ref(new Set<string>());

  function persist() {
    if (!rootPath.value) return;
    try {
      sessionStorage.setItem(storageKey(rootPath.value), JSON.stringify([...expanded.value]));
    } catch {
      // Ignore — state stays in memory when storage is unavailable.
    }
  }

  return {
    init(path: string) {
      rootPath.value = path;
      expanded.value = readPersisted(storageKey(path));
    },
    isExpanded(dirPath: string) {
      return expanded.value.has(dirPath);
    },
    toggle(dirPath: string) {
      const next = new Set(expanded.value);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
      }
      expanded.value = next;
      persist();
    },
    revealPath(filePath: string) {
      const next = new Set(expanded.value);
      let changed = false;
      for (const dir of parentDirs(filePath)) {
        if (!next.has(dir)) {
          next.add(dir);
          changed = true;
        }
      }
      if (changed) {
        expanded.value = next;
        persist();
      }
    },
  };
}