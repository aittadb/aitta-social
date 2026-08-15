import { readdir } from "node:fs/promises";
import path from "node:path";

/** Returns the repository's ordered Drizzle migration paths. */
export async function migrationInventory(repositoryRoot) {
  return (await readdir(path.join(repositoryRoot, "drizzle"), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/u.test(entry.name))
    .map((entry) => `drizzle/${entry.name}`)
    .sort();
}
