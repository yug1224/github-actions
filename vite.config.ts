import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    singleQuote: true,
    printWidth: 120,
  },
  lint: {
    ignorePatterns: ['**/node_modules/**', '**/data/**', '**/temp/**', '**/*.avif', '**/*.pdf'],
    plugins: ['typescript'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: ['**/*.test.ts', '**/*_test.ts'],
        plugins: ['typescript', 'vitest'],
      },
    ],
  },
  test: {
    projects: [
      {
        test: {
          name: 'github-star-notifier',
          root: './github-star-notifier',
          include: ['tests/**/*_test.ts', 'tests/**/*_test.tsx'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'rss-feed-notifier',
          root: './rss-feed-notifier',
          include: ['tests/**/*_test.ts', 'tests/**/*_test.tsx'],
          environment: 'node',
        },
      },
    ],
  },
});
