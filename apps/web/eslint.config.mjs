import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  ...compat.extends('next', 'next/core-web-vitals', 'next/typescript'),
  {
    rules: {},
  },
];
