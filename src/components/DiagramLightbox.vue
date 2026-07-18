<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import panzoom, { type PanZoom } from "panzoom";
import { renderDiagram } from "../mermaid-runtime";

const props = defineProps<{
  source: string | null;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const stage = ref<HTMLElement | null>(null);
const canvas = ref<HTMLElement | null>(null);
let instance: PanZoom | null = null;

function dispose() {
  instance?.dispose();
  instance = null;
}

async function open(source: string) {
  await nextTick();
  if (!canvas.value || !stage.value) return;

  canvas.value.innerHTML = await renderDiagram(source, "lightbox");

  const svg = canvas.value.querySelector("svg");
  let width = 0;
  let height = 0;
  if (svg) {
    const box = svg.viewBox.baseVal;
    width = box && box.width ? box.width : svg.getBBox().width;
    height = box && box.height ? box.height : svg.getBBox().height;
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;
    svg.style.maxWidth = "none";
    svg.style.maxHeight = "none";
  }

  dispose();
  instance = panzoom(canvas.value, {
    maxZoom: 20,
    minZoom: 0.1,
    smoothScroll: false,
    zoomDoubleClickSpeed: 1,
  });

  fitToStage(width, height);
}

function fitToStage(width: number, height: number) {
  if (!instance || !stage.value || width === 0 || height === 0) return;

  const margin = 80;
  const rect = stage.value.getBoundingClientRect();
  const scale = Math.min(
    (rect.width - margin) / width,
    (rect.height - margin) / height,
    1,
  );

  instance.zoomAbs(0, 0, scale);
  const offsetX = (rect.width - width * scale) / 2;
  const offsetY = (rect.height - height * scale) / 2;
  instance.moveTo(offsetX, offsetY);
}


function zoomBy(factor: number) {
  if (!instance || !stage.value) return;
  const rect = stage.value.getBoundingClientRect();
  instance.smoothZoom(rect.width / 2, rect.height / 2, factor);
}

function reset() {
  if (!instance) return;
  instance.moveTo(0, 0);
  instance.zoomAbs(0, 0, 1);
}

function onKey(event: KeyboardEvent) {
  if (event.key === "Escape") emit("close");
}

watch(
  () => props.source,
  (source) => {
    if (source) {
      window.addEventListener("keydown", onKey);
      open(source);
    } else {
      window.removeEventListener("keydown", onKey);
      dispose();
    }
  },
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  dispose();
});
</script>

<template>
  <div v-if="source" class="lightbox-backdrop" @click.self="emit('close')">
    <div ref="stage" class="lightbox-stage">
      <div ref="canvas" class="lightbox-canvas"></div>
    </div>
    <div class="lightbox-controls">
      <button title="Zoom in" @click="zoomBy(1.3)">+</button>
      <button title="Zoom out" @click="zoomBy(0.77)">−</button>
      <button title="Reset" @click="reset">⟲</button>
      <button title="Close (Esc)" @click="emit('close')">✕</button>
    </div>
  </div>
</template>
