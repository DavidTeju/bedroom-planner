import { vi } from "vitest";
import fs from "node:fs";

// A file in the repo, as text.
export const file = (name: string): string => fs.readFileSync(new URL("../" + name, import.meta.url), "utf8");

// A fresh copy of the shared planner module, with its own empty storage.
export async function loadCore() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
  vi.resetModules();
  return import("../src/core.ts");
}
