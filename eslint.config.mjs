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
      { selector: `Program > ClassDeclaration[id.name='${name}']`, message },
      { selector: `Program > ExportNamedDeclaration > ClassDeclaration[id.name='${name}']`, message },
      { selector: `Program > ExportDefaultDeclaration > ClassDeclaration[id.name='${name}']`, message },
      { selector: `Program > ExportDefaultDeclaration > ClassExpression[id.name='${name}']`, message },
      { selector: `Program > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='ArrowFunctionExpression']`, message },
      { selector: `Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='ArrowFunctionExpression']`, message },
      { selector: `Program > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='FunctionExpression']`, message },
      { selector: `Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='FunctionExpression']`, message },
      { selector: `Program > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='ClassExpression']`, message },
      { selector: `Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='${name}'][init.type='ClassExpression']`, message },
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
const eslintRestrictedSyntaxRestrictions = declarationRestrictions(
  ["restrictedSyntaxErrorCount", "restrictedSyntaxErrors"],
  "tests/helpers/eslint-restricted-syntax.mjs",
  "restrictedSyntaxErrorCount",
);
const deletionAcknowledgementRestrictions = declarationRestrictions(
  ["deletionAcknowledgement"],
  "tests/helpers/deletion-acknowledgement-contract.mjs",
);
const legacyDeletionAcknowledgementRestrictions = declarationRestrictions(
  ["acknowledgement"],
  "tests/helpers/deletion-acknowledgement-contract.mjs",
  "deletionAcknowledgement",
);
const publicFooterRestrictions = declarationRestrictions(
  ["publicFooter"],
  "tests/helpers/public-footer-contract.mjs",
);
const privateJsonResponseRestrictions = declarationRestrictions(
  ["assertPrivateJson"],
  "tests/helpers/private-json-response.mjs",
);
const errorDocumentRestrictions = declarationRestrictions(
  ["errorDocument"],
  "tests/helpers/error-document-contract.mjs",
);
const apiV1JsonResponseRestrictions = declarationRestrictions(
  ["assertApiJson"],
  "tests/helpers/api-v1-json-response.mjs",
);
const apiV1HeadResponseCanonicalRestrictions = declarationRestrictions(
  ["assertMatchingApiV1HeadHeaders"],
  "tests/helpers/api-v1-head-response.mjs",
);
const apiV1HeadResponseLegacyRestrictions = declarationRestrictions(
  ["assertMatchingHeaders", "assertMatchingHeadHeaders"],
  "tests/helpers/api-v1-head-response.mjs",
  "assertMatchingApiV1HeadHeaders",
);
const acceptMediaRangeRestrictions = declarationRestrictions(
  ["parseAcceptMediaRanges", "parseMediaRange", "validParameterValue", "splitOutsideQuotes"],
  "lib/accept-media-ranges.ts",
  "parseAcceptMediaRanges",
);
const pageTextBoundaryRestrictions = declarationRestrictions(
  ["characterLength", "hasForbiddenTextControl", "hasUrlControl"],
  "lib/custom-pages/page-text-boundaries.ts",
);
const pageInlineVisibleTextRestrictions = declarationRestrictions(
  ["pageInlineVisibleText"],
  "lib/custom-pages/page-document.ts",
);
const legacyPageInlineVisibleTextRestrictions = declarationRestrictions(
  ["visibleInlineText", "inlineVisibleText"],
  "lib/custom-pages/page-document.ts",
  "pageInlineVisibleText",
);
const rfc6570PathSegmentRestrictions = declarationRestrictions(
  ["rfc6570PathSegment", "apiV1EntryIdPathSegment", "privateEntryIdPathSegment"],
  "lib/rfc6570-path-segment.ts",
  "rfc6570PathSegment",
);
const orderedTextAssertionRestrictions = declarationRestrictions(
  ["assertOrdered"],
  "tests/helpers/ordered-text-assertion.mjs",
);
const regularExpressionMatchCountRestrictions = declarationRestrictions(
  ["countMatches"],
  "tests/helpers/regular-expression-match-count.mjs",
);
const cssClampPixelsRestrictions = declarationRestrictions(
  ["clampPixels"],
  "tests/helpers/css-clamp-pixels.mjs",
);
const canonicalRepositorySourceRestrictions = declarationRestrictions(
  ["readRepositorySource"],
  "tests/helpers/repository-source.mjs",
);
const legacyRepositorySourceRestrictions = declarationRestrictions(
  ["readSource"],
  "tests/helpers/repository-source.mjs",
  "readRepositorySource",
);
const assistedRuntimeLegacySourceRestrictions = declarationRestrictions(
  ["source"],
  "tests/helpers/repository-source.mjs",
  "readRepositorySource",
);

const declarationRestrictionSets = [
  recordShapeRestrictions,
  regularExpressionLiteralRestrictions,
  eslintRestrictedSyntaxRestrictions,
  deletionAcknowledgementRestrictions,
  legacyDeletionAcknowledgementRestrictions,
  publicFooterRestrictions,
  privateJsonResponseRestrictions,
  errorDocumentRestrictions,
  apiV1JsonResponseRestrictions,
  apiV1HeadResponseCanonicalRestrictions,
  apiV1HeadResponseLegacyRestrictions,
  acceptMediaRangeRestrictions,
  pageTextBoundaryRestrictions,
  pageInlineVisibleTextRestrictions,
  legacyPageInlineVisibleTextRestrictions,
  rfc6570PathSegmentRestrictions,
  orderedTextAssertionRestrictions,
  regularExpressionMatchCountRestrictions,
  cssClampPixelsRestrictions,
  canonicalRepositorySourceRestrictions,
  legacyRepositorySourceRestrictions,
];

const canonicalDeclarationFiles = [
  ["lib/record-shape.ts", recordShapeRestrictions],
  ["tests/helpers/regular-expression-literal.mjs", regularExpressionLiteralRestrictions],
  ["tests/helpers/eslint-restricted-syntax.mjs", eslintRestrictedSyntaxRestrictions],
  ["tests/helpers/deletion-acknowledgement-contract.mjs", deletionAcknowledgementRestrictions],
  ["tests/helpers/public-footer-contract.mjs", publicFooterRestrictions],
  ["tests/helpers/private-json-response.mjs", privateJsonResponseRestrictions],
  ["tests/helpers/error-document-contract.mjs", errorDocumentRestrictions],
  ["tests/helpers/api-v1-json-response.mjs", apiV1JsonResponseRestrictions],
  ["tests/helpers/api-v1-head-response.mjs", apiV1HeadResponseCanonicalRestrictions],
  ["lib/accept-media-ranges.ts", acceptMediaRangeRestrictions],
  ["lib/custom-pages/page-text-boundaries.ts", pageTextBoundaryRestrictions],
  ["lib/custom-pages/page-document.ts", pageInlineVisibleTextRestrictions],
  ["lib/rfc6570-path-segment.ts", rfc6570PathSegmentRestrictions],
  ["tests/helpers/ordered-text-assertion.mjs", orderedTextAssertionRestrictions],
  ["tests/helpers/regular-expression-match-count.mjs", regularExpressionMatchCountRestrictions],
  ["tests/helpers/css-clamp-pixels.mjs", cssClampPixelsRestrictions],
  ["tests/helpers/repository-source.mjs", canonicalRepositorySourceRestrictions],
];

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
        ...declarationRestrictionSets.flat(),
      ],
    },
  },
  ...canonicalDeclarationFiles.map(([file, canonicalRestrictions]) => ({
    files: [file],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...declarationRestrictionSets.filter((restrictions) => restrictions !== canonicalRestrictions).flat(),
      ],
    },
  })),
  {
    files: ["tests/assisted-runtime-journey.test.mjs"],
    rules: {
      "no-restricted-syntax": ["error", ...declarationRestrictionSets.flat(), ...assistedRuntimeLegacySourceRestrictions],
    },
  },
]);

export default eslintConfig;
