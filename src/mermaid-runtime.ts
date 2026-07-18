import mermaid from "mermaid";
import elkLayouts from "@mermaid-js/layout-elk";
import { theme } from "./theme";

let registered = false;
let seq = 0;

function ensureRegistered() {
  if (registered) return;
  mermaid.registerLayoutLoaders(elkLayouts);
  registered = true;
}

function configure() {
  ensureRegistered();
  mermaid.initialize({
    startOnLoad: false,
    layout: "elk",
    theme: theme.value === "dark" ? "dark" : "default",
    securityLevel: "loose",
  });
}

export async function renderDiagram(
  source: string,
  idPrefix = "mermaid",
): Promise<string> {
  configure();
  const { svg } = await mermaid.render(`${idPrefix}-${seq++}`, source);
  return svg;
}
