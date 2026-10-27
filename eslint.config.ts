import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default defineConfig([
  // 1. Global Exclusions: Instantly ignore build and cache artifacts to keep runs lightning fast
  { 
    ignores: [
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "vite.config.ts", 
      "sw.ts"
    ] 
  },
  
  // 2. Core Execution Gate: Unified layout rules for React + Vite + TypeScript
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser as any,       // Typecast to bypass strict ESLint v10 internal parser constraints
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true                         // Tells ESLint to allow React JSX formatting syntax
        }
      },
      globals: {
        ...globals.browser,                 // Enables browser objects like window and document
        ...globals.es2021
      },
    },
    // Adding 'as any' here forces TypeScript to accept older plugin shapes into ESLint v10's strict type system
    plugins: {
      "@typescript-eslint": tseslint.plugin as any,
      "react": reactPlugin as any,
      "react-hooks": reactHooks as any,
      "react-refresh": reactRefresh as any,
    },
    // Merging recommended rule configurations directly into the rule block
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.reduce((acc, config) => ({ ...acc, ...config.rules }), {}),

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off" 
    } as any,
    settings: {
      react: {
        version: "detect"                   // Automatically grabs your exact installed React engine version
      }
    }
  }
]);