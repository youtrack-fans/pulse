import { fixupConfigRules } from "@eslint/compat";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default tseslint.config(
  { files: ["**/*.{js,cjs,ts,tsx}"] },
  {
    ignores: [
      "**/dist",
      "eslint.config.mjs",
      "experiments/**",
      "src/api/api.d.ts",
      "src/api/api.zod.ts",
      "src/api/app.d.ts",
      "src/api/extended-*.d.ts",
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      "@jetbrains",
      "@jetbrains/eslint-config/react",
      "@jetbrains/eslint-config/browser",
      "plugin:react-hooks/recommended",
    ),
  ),
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-refresh": reactRefresh,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tseslint.parser,
    },

    rules: {
      "react/jsx-no-literals": "off",
      "react-refresh/only-export-components": "off",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": ["error", {article: ["button"]}],
      "no-magic-numbers": "off",
      "@typescript-eslint/no-magic-numbers": ["error", {
        "ignore": [-1, 0, 1, 2, 100, 200, 201, 204, 400, 401, 403, 404, 500],
        "ignoreNumericLiteralTypes": true,
        "ignoreArrayIndexes": true,
        "ignoreDefaultValues": true,
        "ignoreClassFieldInitialValues": true,
        "enforceConst": true,
      }],
      "complexity": ["error", 25],
    }
  },
  {
    files: ["vite-plugin-*.ts", "vite.config*.ts"],
    rules: {
      "complexity": "off",
      "@typescript-eslint/no-magic-numbers": "off",
    }
  },
  {
    files: ["src/**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
    }
  },
  {
    files: ["src/lib/utils.ts"],
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
    }
  },
  {
    files: ["src/*.js"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
