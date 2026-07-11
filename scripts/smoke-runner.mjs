import { runnerImport } from '@voidzero-dev/vite-plus-core';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// 副作用のない極小 TS を runnerImport で読み込み、vite-plus / vite-plus-core /
// ネイティブバインディングのプラグイン解決が破綻していないかをマージ前に検知する。
// 本番 notifier と同じ scripts/run-module-runner.mjs の実行経路（runnerImport）を通す。
const dir = mkdtempSync(join(tmpdir(), 'vite-plus-smoke-'));
const entry = join(dir, 'smoke.ts');
writeFileSync(entry, 'export const answer: number = 1 + 1;\n');

try {
  const { module } = await runnerImport(entry, { root: process.cwd() });
  if (module.answer !== 2) {
    throw new Error(`予期しない結果: answer=${module.answer}`);
  }
  console.log('vite-plus 起動 smoke test OK: runnerImport が正常に解決した');
} catch (error) {
  console.error('vite-plus 起動 smoke test に失敗しました:');
  console.error(error);
  process.exit(1);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
