import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      ".next/",
      "out/",
      "build/",
      "dist/",
      "node_modules/",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      ".env*",
      ".cache/",
      ".turbo/",
      "*.log",
      ".DS_Store",
      "Thumbs.db"
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];