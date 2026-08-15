import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '.next', 'worker-configuration.d.ts'] },

  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],

    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },

    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },

    rules: {
      ...reactHooks.configs.recommended.rules,

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      complexity: ['warn', 16],
      'max-classes-per-file': ['error', 1],
      'max-lines': [
        'warn',
        {
          max: 320,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'max-lines-per-function': [
        'warn',
        {
          max: 90,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    files: ['lib/**/*.ts'],
    rules: {
      complexity: ['warn', 20],
      'max-lines-per-function': ['warn', {
        max: 140,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
  },
  {
    files: ['lib/custom-pages/**/*.{ts,tsx}'],
    rules: {
      complexity: ['warn', 28],
      'max-lines': ['warn', {
        max: 560,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
  },
  {
    files: ['app/owner/**/*.{ts,tsx}'],
    rules: {
      complexity: ['warn', 18],
      'max-lines-per-function': ['warn', {
        max: 140,
        skipBlankLines: true,
        skipComments: true,
      }],
      'max-lines': ['warn', {
        max: 620,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
  },
  {
    files: ['app/owner/profile/ProfileForm.tsx'],
    rules: {
      complexity: ['warn', 100],
      'max-lines-per-function': ['warn', {
        max: 420,
        skipBlankLines: true,
        skipComments: true,
      }],
      'max-lines': ['off'],
    },
  },
  {
    files: ['app/**/page.tsx', 'app/**/layout.tsx', 'app/page.tsx', 'app/layout.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
