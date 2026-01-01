import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Disable strict TypeScript rules to accommodate existing codebase state
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-control-regex': 'off',
      'prefer-const': 'off',
    },
  },
  {
    files: ['src/test/**'],
    rules: {
      'no-console': 'off',
    },
  },
);
