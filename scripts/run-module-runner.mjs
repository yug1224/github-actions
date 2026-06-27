import { runnerImport } from '@voidzero-dev/vite-plus-core';
import { resolve } from 'node:path';

const entryArg = process.argv[2];
if (!entryArg) {
  console.error('Usage: node scripts/run-module-runner.mjs <entry.ts>');
  process.exit(1);
}

const root = process.cwd();
const entry = resolve(root, entryArg);

try {
  await runnerImport(entry, { root });
} catch (error) {
  console.error(error);
  process.exit(1);
}
