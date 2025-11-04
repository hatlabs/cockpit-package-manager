import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/*.test.ts', '**/*.test.tsx'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['packagemanager/**/*.ts', 'packagemanager/**/*.tsx'],
            exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.d.ts'],
        },
    },
});
