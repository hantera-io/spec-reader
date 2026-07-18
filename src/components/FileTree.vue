<script setup lang="ts">
import { ref } from "vue";
import type { TreeNode } from "../api";

const props = defineProps<{
  nodes: TreeNode[];
  activePath: string | null;
  depth?: number;
}>();

const emit = defineEmits<{
  (event: "select", path: string): void;
}>();

const collapsed = ref<Record<string, boolean>>({});

function toggle(path: string) {
  collapsed.value[path] = !collapsed.value[path];
}

function isCollapsed(path: string): boolean {
  return collapsed.value[path] === true;
}
</script>

<template>
  <div class="tree-item" v-for="node in nodes" :key="node.path">
    <template v-if="node.type === 'dir'">
      <div class="tree-row" @click="toggle(node.path)">
        <span class="tree-icon">{{ isCollapsed(node.path) ? "▸" : "▾" }}</span>
        <span>{{ node.name }}</span>
      </div>
      <div v-show="!isCollapsed(node.path)" class="tree-children">
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
