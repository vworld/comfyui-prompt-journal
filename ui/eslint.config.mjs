import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import importX from "eslint-plugin-import-x";
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importAlias from "@dword-design/eslint-plugin-import-alias";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import * as sonarjs from "eslint-plugin-sonarjs";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}", "**/*.{js,jsx}"],
    ignores: ["eslint.config.js", "src-tauri/**/*", "src/components/ui/**/*"],
    extends: [
      js.configs.recommended,
      // tseslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      reactX.configs["recommended-typescript"],
      reactDom.configs.recommended,
      eslintConfigPrettier,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      importAlias.configs.recommended,
      eslintPluginUnicorn.configs.recommended,
      sonarjs.configs.recommended,
      eslintPluginPrettier,
    ],
    plugins: {},
    rules: {
      "import-x/order": [
        "error",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc" },
          distinctGroup: true,
          groups: [
            "builtin",
            "external",
            // Then sibling and parent imports. They can be mingled together
            ["sibling", "parent"],
            // Then index file imports
            "index",
            // Then any arcane TypeScript imports
            "object",
            // Then the omitted imports: internal, external, type, unknown
            "type",
          ],
        },
      ],

      "sort-imports": ["error", { ignoreDeclarationSort: true }],

      "import-x/no-duplicates": "error",

      "@dword-design/import-alias/prefer-alias": ["error", { aliasForSubpaths: true }],

      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],

      "@typescript-eslint/switch-exhaustiveness-check": "error",

      "unicorn/prefer-query-selector": "off",
      "unicorn/consistent-class-member-order": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/name-replacements": "off",
      "unicorn/consistent-boolean-name": "off",
      "unicorn/prefer-minimal-ternary": "off",
      "unicorn/no-non-function-verb-prefix": "off",
      "unicorn/no-null": "off",
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            camelCase: false,
            pascalCase: true,
            kebabCase: true,
            snakeCase: false,
          },
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.app.json", "tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser,
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          project: ["./tsconfig.json"],
        }),
      ],
    },
  },
]);
