export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
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
    plugins: {
      react: require('eslint-plugin-react'),
    },
    rules: {
      // React specific rules
    },
  },
];
