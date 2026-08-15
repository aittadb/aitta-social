/**
 * Creates the minimal D1 boundary that fails storage access with a test canary.
 *
 * @param {string} message exact error message for each failed prepare call
 * @returns {{ prepare(): never }} fresh throwing D1 substitute
 */
export function throwingD1(message) {
  return {
    prepare() {
      throw new Error(message);
    },
  };
}
