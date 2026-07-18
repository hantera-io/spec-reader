import { ref, watch } from "vue";

export type Theme = "light" | "dark";

const STORAGE_KEY = "spec-reader-theme";

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const theme = ref<Theme>(initialTheme());

function apply(value: Theme) {
  document.documentElement.dataset.theme = value;
}

apply(theme.value);

watch(theme, (value) => {
  apply(value);
  localStorage.setItem(STORAGE_KEY, value);
});

export function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}
