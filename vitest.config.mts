import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.ts'],
        setupFiles: ['tests/setup.ts'],
        restoreMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['js/**/*.ts'],
            exclude: ['js/app.ts', 'js/core/types.ts'],
        },
    },
});
