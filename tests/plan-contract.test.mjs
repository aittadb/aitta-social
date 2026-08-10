import assert from "node:assert/strict";
import test from "node:test";
import { validatePlanGraph } from "../scripts/check-plan.mjs";

const task = (id, title, dependencies = "none") =>
  `- [ ] **${id} — ${title}.** One bounded outcome. DoD: add its evidence and pass validation. Depends on: ${dependencies}.`;
const done = (id) => `- **${id} — Completed outcome.** Evidence is archived.`;

test("accepts an ordered acyclic graph with direct dependencies", () => {
  const plan = [task("TASK-040", "First"), task("TASK-041", "Second", "TASK-040"), task("TASK-043", "Parallel", "TASK-001")].join("\n");
  assert.deepEqual(validatePlanGraph(plan, done("TASK-001")), { active: 3, completed: 1 });
});

test("rejects malformed, duplicate, reused, unknown, self, repeated, and cyclic tasks", () => {
  assert.throws(() => validatePlanGraph("- [ ] **TASK-040 — Missing contract.**", ""), /stable PLAN syntax|Invalid PLAN task syntax/);
  assert.throws(() => validatePlanGraph([task("TASK-040", "First"), task("TASK-040", "Second")].join("\n"), ""), /duplicated/);
  assert.throws(() => validatePlanGraph(task("TASK-040", "First"), done("TASK-040")), /both open and completed/);
  assert.throws(() => validatePlanGraph(task("TASK-040", "First", "TASK-999"), ""), /unknown TASK-999/);
  assert.throws(() => validatePlanGraph(task("TASK-040", "First", "TASK-040"), ""), /depends on itself/);
  assert.throws(() => validatePlanGraph(task("TASK-040", "First", "TASK-001, TASK-001"), done("TASK-001")), /repeats a dependency/);
  assert.throws(
    () => validatePlanGraph([task("TASK-040", "First", "TASK-041"), task("TASK-041", "Second", "TASK-040")].join("\n"), ""),
    /dependency cycle/,
  );
});

test("rejects duplicate titles, unstable ordering, and redundant transitive edges", () => {
  assert.throws(() => validatePlanGraph([task("TASK-040", "Same"), task("TASK-041", "Same")].join("\n"), ""), /repeats the task title/);
  assert.throws(() => validatePlanGraph([task("TASK-041", "Later"), task("TASK-040", "Earlier")].join("\n"), ""), /stable numeric order/);
  assert.throws(
    () =>
      validatePlanGraph(
        [task("TASK-040", "First"), task("TASK-041", "Second", "TASK-040"), task("TASK-042", "Third", "TASK-040, TASK-041")].join("\n"),
        "",
      ),
    /redundant dependency TASK-040 through TASK-041/,
  );
});
