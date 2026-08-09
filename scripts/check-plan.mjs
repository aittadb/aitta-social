import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [plan, changelog] = await Promise.all([
  readFile(new URL("../PLAN.md", import.meta.url), "utf8"),
  readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8"),
]);

const open = new Map();
const lines = plan.split("\n").filter((line) => line.startsWith("- [ ] **TASK-"));
for (const line of lines) {
  const match = line.match(/^- \[ \] \*\*(TASK-(\d{3})) — .+?\*\* .+ DoD: .+ Depends on: (.+)\.$/);
  assert(match, `Invalid PLAN task syntax: ${line}`);
  const [, id, number, dependencyText] = match;
  assert(!open.has(id), `${id} is duplicated in PLAN.md`);
  open.set(id, { number: Number(number), dependencies: parseDependencies(dependencyText) });
}
assert.equal(lines.length, [...plan.matchAll(/^- \[ \] \*\*TASK-/gm)].length, "Every task must use the stable PLAN syntax");

const completedIds = [...changelog.matchAll(/^- \*\*(TASK-\d{3}) —/gm)].map((match) => match[1]);
const completed = new Set(completedIds);
assert.equal(completed.size, completedIds.length, "CHANGELOG.md contains a duplicate task ID");
const known = new Set([...open.keys(), ...completed]);

for (const [id, task] of open) {
  assert(!completed.has(id), `${id} is both open and completed`);
  assert(!task.dependencies.includes(id), `${id} depends on itself`);
  assert.equal(new Set(task.dependencies).size, task.dependencies.length, `${id} repeats a dependency`);
  for (const dependency of task.dependencies) assert(known.has(dependency), `${id} references unknown ${dependency}`);
}

const visiting = new Set();
const visited = new Set();
function visit(id, path = []) {
  if (visited.has(id)) return;
  assert(!visiting.has(id), `PLAN dependency cycle: ${[...path, id].join(" -> ")}`);
  visiting.add(id);
  for (const dependency of open.get(id)?.dependencies ?? []) if (open.has(dependency)) visit(dependency, [...path, id]);
  visiting.delete(id);
  visited.add(id);
}
for (const id of open.keys()) visit(id);
console.log(`PLAN graph is valid (${open.size} active, ${completed.size} completed tasks).`);

function parseDependencies(value) {
  if (value === "none") return [];
  const range = value.match(/^TASK-(\d{3}) through TASK-(\d{3})$/);
  if (range) {
    const start = Number(range[1]);
    const end = Number(range[2]);
    assert(start <= end, "Dependency range must be ascending");
    return Array.from({ length: end - start + 1 }, (_, index) => `TASK-${String(start + index).padStart(3, "0")}`);
  }
  assert(/^TASK-\d{3}(, TASK-\d{3})*$/.test(value), `Invalid dependency clause: ${value}`);
  return value.split(", ");
}
