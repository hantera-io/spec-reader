<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { renderMarkdown } from "../markdown";
import { renderDiagram } from "../mermaid-runtime";
import { theme } from "../theme";
import DiagramLightbox from "./DiagramLightbox.vue";
import { hydrate, type HydrateResult } from "@grafiq/markdown-it/hydrate";
import "@grafiq/markdown-it/styles.css";

const props = defineProps<{
  source: string;
  basePath: string;
}>();

const emit = defineEmits<{
  (event: "navigate", path: string): void;
}>();

const container = ref<HTMLElement | null>(null);
const html = ref("");
const lightboxSource = ref<string | null>(null);

function resolveRelative(from: string, href: string): string {
  const fromDir = from.includes("/") ? from.slice(0, from.lastIndexOf("/")) : "";
  const stack = fromDir ? fromDir.split("/") : [];

  for (const part of href.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }

  return stack.join("/");
}

function onClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  const anchor = target.closest("a");
  if (!anchor) {
    // Clicking anywhere on a diagram opens it full screen. Links inside the
    // SVG (e.g. mermaid node hyperlinks) skip this and are handled below.
    if (event.button !== 0) return;
    const host = target.closest<HTMLElement>(".mermaid");
    if (host?.dataset.source) {
      event.preventDefault();
      lightboxSource.value = host.dataset.source;
    }
    return;
  }

  const href = anchor.getAttribute("href");
  if (!href) return;

  if (href.startsWith("#")) return;

  const isExternal = /^[a-z]+:\/\//i.test(href) || href.startsWith("mailto:");
  if (isExternal) {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noreferrer noopener");
    return;
  }

  const [pathPart, hash] = href.split("#");
  if (pathPart.toLowerCase().endsWith(".md")) {
    event.preventDefault();
    const resolved = resolveRelative(props.basePath, pathPart);
    emit("navigate", hash ? `${resolved}#${hash}` : resolved);
  }
}

let grafiqResult: HydrateResult | null = null;

const GRAFIQ_DARK_THEME = {
  ink: "#e6edf3",
  inkLight: "#8b949e",
  fill: "#161b22",
  accent: "#4493f8",
  accentFill: "#1f3b5c",
  paper: "#0d1117",
};

function hydrateGrafiq() {
  if (!container.value) return;

  grafiqResult?.destroy();
  grafiqResult = null;

  // Reset any previously hydrated placeholders so hydrate() picks them up
  // again (needed when the theme changes but the HTML stays the same).
  for (const el of Array.from(
    container.value.querySelectorAll<HTMLElement>(".grafiq-mockup")
  )) {
    if (el.dataset.grafiqHydrated) {
      delete el.dataset.grafiqHydrated;
      el.replaceChildren();
    }
  }

  grafiqResult = hydrate({
    root: container.value,
    theme: theme.value === "dark" ? GRAFIQ_DARK_THEME : undefined,
  });
}

async function renderMermaid() {
  const nodes = container.value?.querySelectorAll<HTMLElement>(".mermaid");
  if (!nodes || nodes.length === 0) return;

  for (const node of Array.from(nodes)) {
    const source = node.dataset.source ?? node.textContent ?? "";
    node.dataset.source = source;
    try {
      node.innerHTML = await renderDiagram(source);
    } catch (error) {
      node.innerHTML = `<pre class="error-state">${String(error)}</pre>`;
    }
  }
}

async function rerender() {
  html.value = await renderMarkdown(props.source);
  await nextTick();
  await renderMermaid();
  hydrateGrafiq();
}

onMounted(rerender);
onBeforeUnmount(() => grafiqResult?.destroy());
watch(() => props.source, rerender);
watch(theme, () => {
  renderMermaid();
  hydrateGrafiq();
});
</script>

<template>
  <div
    ref="container"
    class="markdown-body"
    v-html="html"
    @click="onClick"
  ></div>
  <DiagramLightbox
    :source="lightboxSource"
    @close="lightboxSource = null"
  />
</template>
