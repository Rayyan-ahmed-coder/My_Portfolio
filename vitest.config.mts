import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'preact',
    },
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
        setupFiles: ['tests/setup.ts'],
        restoreMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['js/**/*.ts', 'js/**/*.tsx'],
            exclude: ['js/app.ts', 'js/core/types.ts'],
        },
    },
});
