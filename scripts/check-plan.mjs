import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function validatePlanGraph(plan, changelog) {
  const open = new Map();
  const titles = new Set();
  const lines = plan.split("\n").filter((line) => line.startsWith("- [ ] **TASK-"));
  let previousNumber = -1;
  for (const line of lines) {
    const match = line.match(/^- \[ \] \*\*(TASK-(\d{3})) — (.+?)\*\* .+ DoD: .+ Depends on: (.+)\.$/);
    assert(match, `Invalid PLAN task syntax: ${line}`);
    const [, id, number, title, dependencyText] = match;
    assert(!open.has(id), `${id} is duplicated in PLAN.md`);
    assert(!titles.has(title), `PLAN.md repeats the task title: ${title}`);
    assert(Number(number) > previousNumber, `${id} is out of stable numeric order in PLAN.md`);
    previousNumber = Number(number);
    titles.add(title);
    open.set(id, { dependencies: parseDependencies(dependencyText) });
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

  for (const [id, task] of open) {
    for (const dependency of task.dependencies) {
      for (const alternate of task.dependencies) {
        if (alternate !== dependency && reaches(open, alternate, dependency)) {
          assert.fail(`${id} has redundant dependency ${dependency} through ${alternate}`);
        }
      }
    }
  }

  return { active: open.size, completed: completed.size };
}

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

function reaches(open, start, target, seen = new Set()) {
  if (!open.has(start) || seen.has(start)) return false;
  seen.add(start);
  for (const dependency of open.get(start).dependencies) {
    if (dependency === target || reaches(open, dependency, target, seen)) return true;
  }
  return false;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [plan, changelog] = await Promise.all([
    readFile(new URL("../PLAN.md", import.meta.url), "utf8"),
    readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8"),
  ]);
  const result = validatePlanGraph(plan, changelog);
  console.log(`PLAN graph is valid (${result.active} active, ${result.completed} completed tasks).`);
}
