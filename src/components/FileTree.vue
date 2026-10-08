<script setup lang="ts">
import { inject } from "vue";
import type { TreeNode } from "../api";
import { TREE_EXPANSION, type TreeExpansionStore } from "../tree-state";

const props = defineProps<{
  nodes: TreeNode[];
  activePath: string | null;
  depth?: number;
}>();

const emit = defineEmits<{
  (event: "select", path: string): void;
}>();

/**
 * Used when the tree is rendered without a provided store (e.g. outside the
 * app): everything stays collapsed and nothing is remembered.
 */
const detachedStore: TreeExpansionStore = {
  init() {},
  isExpanded() {
    return false;
  },
  toggle() {},
  revealPath() {},
};

// Directories are collapsed by default; the app provides the shared store.
const expansion = inject(TREE_EXPANSION, detachedStore);
</script>

<template>
  <div class="tree-item" v-for="node in nodes" :key="node.path">
    <template v-if="node.type === 'dir'">
      <div class="tree-row" @click="expansion.toggle(node.path)">
        <span class="tree-icon">{{ expansion.isExpanded(node.path) ? "▾" : "▸" }}</span>
        <span>{{ node.name }}</span>
      </div>
      <div v-show="expansion.isExpanded(node.path)" class="tree-children">
        <FileTree
          :nodes="node.children ?? []"
          :active-path="activePath"
          :depth="(depth ?? 0) + 1"
          @select="(p) => emit('select', p)"
        />
      </div>
    </template>
    <template v-else>
      <div
        class="tree-row"
        :class="{ active: node.path === activePath }"
        @click="emit('select', node.path)"
      >
        <span class="tree-icon">≡</span>
        <span>{{ node.name }}</span>
      </div>
    </template>
  </div>
</template>
