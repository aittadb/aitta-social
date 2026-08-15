/**
 * Counts diagnostics emitted by the declaration-ownership lint rule.
 *
 * @param {...import("eslint").ESLint.LintResult} results lint results to inspect
 * @returns {number} restricted-syntax diagnostic count
 */
export function restrictedSyntaxErrorCount(...results) {
  return results.flatMap(({ messages }) => messages).filter(({ ruleId }) => ruleId === "no-restricted-syntax").length;
}
