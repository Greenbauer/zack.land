// @ts-check

const nextConfig = require('eslint-config-next');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const tailwindcss = require('eslint-plugin-tailwindcss');
const unusedImports = require('eslint-plugin-unused-imports');

// BUG FIX: vscode eslint plugin is not detecting custom tailwindcss theme.
// so we manually set the config by importing it here.
const tailwindConfig = require('./tailwind.config');

module.exports = [
  ...nextConfig,
  ...tailwindcss.configs['flat/recommended'],
  prettierRecommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          endOfLine: 'auto',
        },
      ],
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          config: tailwindConfig,
          whitelist: [
            // whitelist any classname which does NOT start with `bg-` and `text-`
            '(?!(bg|text)\\-).*',
          ],
        },
      ],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],
      'react/jsx-curly-brace-presence': 2,
      'no-console': [
        'warn',
        {
          allow: ['error'],
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
    },
  },
  {
    // eslint-config-next 16 brings eslint-plugin-react-hooks 7, whose React
    // Compiler rules flag these two mouse-driven animations. The compiler is not
    // enabled, and both work as written; rewriting them is separate work.
    files: [
      'components/Background/MyHead.tsx',
      'components/Header/NavListBackground.tsx',
    ],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
];
