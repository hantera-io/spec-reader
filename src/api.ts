export type Mode = "file" | "folder";

export interface AppConfig {
  mode: Mode;
  rootName: string;
  file: string | null;
}

export interface TreeNode {
  type: "file" | "dir";
  name: string;
  path: string;
  children?: TreeNode[];
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Failed to load config");
  return res.json();
}

export async function fetchTree(): Promise<TreeNode[]> {
  const res = await fetch("/api/tree");
  if (!res.ok) throw new Error("Failed to load tree");
  const body = await res.json();
  return body.tree;
}

export async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`Failed to load file: ${path}`);
  const body = await res.json();
  return body.content;
}
