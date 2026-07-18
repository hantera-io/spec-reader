<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import FileTree from "./components/FileTree.vue";
import MarkdownView from "./components/MarkdownView.vue";
import { theme, toggleTheme } from "./theme";
import {
  fetchConfig,
  fetchTree,
  fetchFile,
  type AppConfig,
  type TreeNode,
} from "./api";

const config = ref<AppConfig | null>(null);
const tree = ref<TreeNode[]>([]);
const currentPath = ref<string | null>(null);
const source = ref("");
const error = ref<string | null>(null);

const isFolderMode = computed(() => config.value?.mode === "folder");

function firstFile(nodes: TreeNode[]): string | null {
  for (const node of nodes) {
    if (node.type === "file") return node.path;
    if (node.children) {
      const found = firstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}

function pathFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  return hash.split("@")[0] || null;
}

function anchorFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  const at = hash.indexOf("@");
  return at >= 0 ? hash.slice(at + 1) : null;
}

async function load(path: string, anchor?: string | null) {
  try {
    error.value = null;
    source.value = await fetchFile(path);
    currentPath.value = path;
    await nextTick();
    if (anchor) {
      document.getElementById(anchor)?.scrollIntoView();
    } else {
      document.querySelector(".content")?.scrollTo({ top: 0 });
    }
  } catch (e) {
    error.value = String(e);
  }
}

function navigateTo(target: string) {
  const [path, anchor] = target.split("#");
  window.location.hash = anchor ? `${path}@${anchor}` : path;
  load(path, anchor);
}

function onSelect(path: string) {
  navigateTo(path);
}

async function refreshTree() {
  if (isFolderMode.value) {
    tree.value = await fetchTree();
  }
}

onMounted(async () => {
  try {
    config.value = await fetchConfig();
  } catch (e) {
    error.value = String(e);
    return;
  }

  if (isFolderMode.value) {
    await refreshTree();
    const initial = pathFromHash() ?? firstFile(tree.value);
    if (initial) await load(initial, anchorFromHash());
  } else if (config.value?.file) {
    await load(config.value.file);
  }

  window.addEventListener("hashchange", () => {
    const path = pathFromHash();
    if (path && path !== currentPath.value) load(path, anchorFromHash());
  });

  if (import.meta.hot) {
    import.meta.hot.on("spec-reader:change", async (data: { kind: string; path: string }) => {
      if (data.kind === "change") {
        if (data.path === currentPath.value) {
          source.value = await fetchFile(data.path);
        }
      } else {
        await refreshTree();
      }
    });
  }
});
</script>

<template>
  <div class="layout">
    <aside v-if="isFolderMode" class="sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">{{ config?.rootName }}</span>
      </div>
      <div class="sidebar-tree">
        <FileTree
          :nodes="tree"
          :active-path="currentPath"
          @select="onSelect"
        />
      </div>
    </aside>

    <main class="content">
      <div class="content-topbar">
        <button
          class="theme-toggle"
          :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'"
          @click="toggleTheme"
        >
          {{ theme === "dark" ? "☀" : "☾" }}
        </button>
      </div>
      <div class="content-inner">
        <div v-if="error" class="error-state">{{ error }}</div>
        <div v-else-if="!currentPath" class="empty-state">
          No markdown files found.
        </div>
        <MarkdownView
          v-else
          :source="source"
          :base-path="currentPath"
          @navigate="navigateTo"
        />
      </div>
    </main>
  </div>
</template>
