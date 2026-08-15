import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { describedBy } from "../app/owner/form-field-description.ts";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

const consumers = [
  "app/owner/entries/EntryForm.tsx",
  "app/owner/profile/ProfileForm.tsx",
];

test("describedBy preserves owner-form identifier composition", () => {
  assert.equal(describedBy(), undefined);
  assert.equal(describedBy(undefined, ""), undefined);
  assert.equal(describedBy(" "), " ");
  assert.equal(describedBy("help", undefined, "error"), "help error");
  assert.equal(describedBy("first", "second", "first"), "first second first");
  assert.equal(describedBy("before after", "error"), "before after error");
});

test("owner forms import describedBy and retain their rendered description composition", async () => {
  const [canonical, entryForm, profileForm] = await Promise.all([
    readFile(new URL("../app/owner/form-field-description.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/entries/EntryForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/profile/ProfileForm.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal((canonical.match(/export function describedBy\(/gu) ?? []).length, 1);
  for (const [consumer, source] of [[consumers[0], entryForm], [consumers[1], profileForm]]) {
    assert.match(source, /import \{ describedBy \} from "\.\.\/form-field-description";/u, consumer);
    assert.doesNotMatch(source, /^function describedBy\(/mu, consumer);
  }
  assert.equal((entryForm.match(/aria-describedby=\{describedBy\(/gu) ?? []).length, 3);
  assert.equal((profileForm.match(/aria-describedby=\{describedBy\(/gu) ?? []).length, 5);
  assert.match(entryForm, /describedBy\("entry-body-help", errorId\("body", fieldErrors\.body\)\)/u);
  assert.match(entryForm, /describedBy\("entry-kind-help", errorId\("kind", fieldErrors\.kind\)\)/u);
  assert.match(entryForm, /describedBy\("entry-destination-help", errorId\("destinationUrl", fieldErrors\.destinationUrl\)\)/u);
  assert.match(profileForm, /describedBy\("short-description-help", errorId\("shortDescription", fieldErrors\.shortDescription\)\)/u);
  assert.match(profileForm, /describedBy\("external-links-help", errorId\("externalLinks", fieldErrors\.externalLinks\)\)/u);
  assert.match(profileForm, /describedBy\("accent-color-help", errorId\("accentColor", fieldErrors\.accentColor\)\)/u);
  assert.match(profileForm, /describedBy\("density-help", errorId\("density", fieldErrors\.density\)\)/u);
  assert.match(profileForm, /describedBy\(helpId, errorId\(name, error\)\)/u);
});

test("lint reserves describedBy for its owner-form leaf and retains response consumption boundaries", async () => {
  const eslint = new ESLint();
  const declarationForms = (name) => [
    `function ${name}() {}`,
    `export function ${name}() {}`,
    `export default function ${name}() {}`,
    `export default (function ${name}() {});`,
    `class ${name} {}`,
    `export class ${name} {}`,
    `export default class ${name} {}`,
    `export default (class ${name} {});`,
    `const ${name} = () => {};`,
    `export const ${name} = () => {};`,
    `const ${name} = function () {};`,
    `export const ${name} = function () {};`,
    `const ${name} = class {};`,
    `export const ${name} = class {};`,
  ];
  const forms = declarationForms("describedBy");
  const results = await Promise.all(forms.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/owner/example.tsx" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function describedBy(...ids: Array<string | undefined>) { return ids.filter(Boolean).join(\" \") || undefined; }",
    { filePath: "app/owner/form-field-description.ts" },
  );
  const [consumeResponseInDescription] = await eslint.lintText(
    "export function describedBy(...ids: Array<string | undefined>) { return ids.filter(Boolean).join(\" \") || undefined; }\nfunction consumeResponse() {}",
    { filePath: "app/owner/form-field-description.ts" },
  );
  const [describedByInConsumeResponse] = await eslint.lintText(
    "export async function consumeResponse(response) { await response.text(); }\nfunction describedBy() {}",
    { filePath: "tests/helpers/response-body-consumption.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), forms.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(consumeResponseInDescription), 1);
  assert.equal(restrictedSyntaxErrorCount(describedByInConsumeResponse), 1);
});
