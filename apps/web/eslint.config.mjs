import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [".next/*", ".next/**", "**/webpack-runtime.js", "**/webpack.js"],
  },
];

export default eslintConfig;
