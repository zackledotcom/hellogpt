const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['types/**/*.d.ts'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      // Add or override rules here
    },
  },
  {
    files: ['**/*.jsx', '**/*.tsx'],
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
    },
    plugins: {
      react: require('eslint-plugin-react'),
    },
    rules: {
      // React specific rules
    },
  },
];
