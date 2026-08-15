import assert from "node:assert/strict";

export function assertPublishedOnlyDetailQueries(db, ids) {
  const entryQueries = db.queries.filter(({ sql }) => /from entries/iu.test(sql));
  assert.equal(entryQueries.length, ids.length);
  assert(entryQueries.every(({ sql }) => /where id = \? and state = \?/iu.test(sql)));
  assert.deepEqual(entryQueries.map(({ values }) => values),
    ids.map((id) => [id, "published"]));
}
