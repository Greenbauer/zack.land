// @ts-check

// BUG FIX: vscode eslint plugin is not detecting custom tailwindcss theme.
// so we manually set the config by importing it here.
const tailwindConfig = require('./tailwind.config');

module.exports = {
  root: true,
  parserOptions: {
    babelOptions: {
      presets: [require.resolve('next/babel')],
    },
  },
  extends: [
    'next',
    'plugin:tailwindcss/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['simple-import-sort', 'unused-imports'],
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
};
