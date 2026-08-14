import { defineConfig, globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import next from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

function declarationRestrictions(names, canonicalPath, canonicalName = undefined) {
  return names.flatMap((name) => {
    const importedName = canonicalName ?? name;
    const message = `Import ${importedName} from ${canonicalPath} instead of redeclaring it.`;
    return [
      { selector: `Program > FunctionDeclaration[id.name='${name}']`, message },
      { selector: `Program > ExportNamedDeclaration > FunctionDeclaration[id.name='${name}']`, message },
      { selector: `Program > ExportDefaultDeclaration > FunctionDeclaration[id.name='${name}']`, message },
      { selector: `Program > ExportDefaultDeclaration > FunctionExpression[id.name='${name}']`, message },
      { selector: `Program > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='ArrowFunctionExpression']`, message },
      { selector: `Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='ArrowFunctionExpression']`, message },
      { selector: `Program > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='FunctionExpression']`, message },
      { selector: `Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='FunctionExpression']`, message },
    ];
  });
}

const recordShapeRestrictions = declarationRestrictions(
  ["isRecord", "hasExactKeys"],
  "lib/record-shape.ts",
);
const regularExpressionLiteralRestrictions = declarationRestrictions(
  ["escapeRegExp", "escapeRegex"],
  "tests/helpers/regular-expression-literal.mjs",
  "escapeRegExp",
);
const acceptMediaRangeRestrictions = declarationRestrictions(
  ["parseAcceptMediaRanges", "parseMediaRange", "validParameterValue", "splitOutsideQuotes"],
  "lib/accept-media-ranges.ts",
  "parseAcceptMediaRanges",
);

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "dist/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended-latest"],
  jsxA11y.flatConfigs.recommended,
  next.configs["core-web-vitals"],
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...recordShapeRestrictions,
        ...regularExpressionLiteralRestrictions,
        ...acceptMediaRangeRestrictions,
      ],
    },
  },
  {
    files: ["lib/record-shape.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...regularExpressionLiteralRestrictions,
        ...acceptMediaRangeRestrictions,
      ],
    },
  },
  {
    files: ["tests/helpers/regular-expression-literal.mjs"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...recordShapeRestrictions,
        ...acceptMediaRangeRestrictions,
      ],
    },
  },
  {
    files: ["lib/accept-media-ranges.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...recordShapeRestrictions,
        ...regularExpressionLiteralRestrictions,
      ],
    },
  },
]);

export default eslintConfig;
