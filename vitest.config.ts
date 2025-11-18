import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'apps/**/{vite,vitest}.config.{mjs,js,ts,mts}',
      'libs/**/{vite,vitest}.config.{mjs,js,ts,mts}',
    ],
  },
});
