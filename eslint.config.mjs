import { defineConfig, globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import next from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

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
    ignores: ["lib/record-shape.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program > FunctionDeclaration[id.name='isRecord']",
          message: "Import isRecord from lib/record-shape.ts instead of redeclaring it.",
        },
        {
          selector: "Program > FunctionDeclaration[id.name='hasExactKeys']",
          message: "Import hasExactKeys from lib/record-shape.ts instead of redeclaring it.",
        },
        {
          selector: "Program > ExportNamedDeclaration > FunctionDeclaration[id.name='isRecord']",
          message: "Import isRecord from lib/record-shape.ts instead of redeclaring it.",
        },
        {
          selector: "Program > ExportNamedDeclaration > FunctionDeclaration[id.name='hasExactKeys']",
          message: "Import hasExactKeys from lib/record-shape.ts instead of redeclaring it.",
        },
        {
          selector: "Program > ExportDefaultDeclaration > FunctionDeclaration[id.name='isRecord']",
          message: "Import isRecord from lib/record-shape.ts instead of redeclaring it.",
        },
        {
          selector: "Program > ExportDefaultDeclaration > FunctionDeclaration[id.name='hasExactKeys']",
          message: "Import hasExactKeys from lib/record-shape.ts instead of redeclaring it.",
        },
        {
          selector: "Program > VariableDeclaration > VariableDeclarator[id.name='isRecord'][init.type='ArrowFunctionExpression']",
          message: "Import isRecord from lib/record-shape.ts instead of redeclaring it.",
        },
        {
          selector: "Program > VariableDeclaration > VariableDeclarator[id.name='hasExactKeys'][init.type='ArrowFunctionExpression']",
          message: "Import hasExactKeys from lib/record-shape.ts instead of redeclaring it.",
        },
        {
          selector: "Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='isRecord'][init.type='ArrowFunctionExpression']",
          message: "Import isRecord from lib/record-shape.ts instead of redeclaring it.",
        },
        {
          selector: "Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='hasExactKeys'][init.type='ArrowFunctionExpression']",
          message: "Import hasExactKeys from lib/record-shape.ts instead of redeclaring it.",
        },
      ],
    },
  },
]);

export default eslintConfig;
