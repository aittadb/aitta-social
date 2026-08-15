import { readFile } from "node:fs/promises";

export function readRepositorySource(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}
