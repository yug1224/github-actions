import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');

const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));

const stripRange = (spec) => spec.replace(/^[\^~]/, '').trim();

const errors = [];

const rootPackageJson = readJson('package.json');
const declaredVitePlus = rootPackageJson.devDependencies?.['vite-plus'];
const declaredCore = rootPackageJson.devDependencies?.['@voidzero-dev/vite-plus-core'];

if (!declaredVitePlus) {
  errors.push('package.json に vite-plus の宣言が見つからない');
}
if (!declaredCore) {
  errors.push('package.json に @voidzero-dev/vite-plus-core の宣言が見つからない');
}

const workspaceYaml = readFileSync(resolve(root, 'pnpm-workspace.yaml'), 'utf8');
const overrideMatch = workspaceYaml.match(/vite:\s*npm:@voidzero-dev\/vite-plus-core@(\S+)/);
const declaredOverride = overrideMatch?.[1];

if (!declaredOverride) {
  errors.push('pnpm-workspace.yaml の overrides.vite に vite-plus-core エイリアスが見つからない');
}

const installedVitePlus = readJson('node_modules/vite-plus/package.json').version;
const installedCore = readJson('node_modules/@voidzero-dev/vite-plus-core/package.json').version;

if (installedVitePlus !== installedCore) {
  errors.push(
    `インストール済みバージョン不整合: vite-plus@${installedVitePlus} と @voidzero-dev/vite-plus-core@${installedCore} が一致しない。` +
      '両者は同一バージョンで揃える必要がある（ネイティブバインディングと JS 層の不整合を防ぐため）',
  );
}

if (declaredCore && stripRange(declaredCore) !== installedCore) {
  errors.push(
    `package.json の @voidzero-dev/vite-plus-core (${declaredCore}) がインストール済み (${installedCore}) と一致しない`,
  );
}

if (declaredOverride && stripRange(declaredOverride) !== installedCore) {
  errors.push(
    `pnpm-workspace.yaml の overrides.vite (${declaredOverride}) が @voidzero-dev/vite-plus-core (${installedCore}) と一致しない。` +
      'Dependabot はこの override エイリアスを更新できないため、vite-plus 更新時は手動で追従すること',
  );
}

if (errors.length > 0) {
  console.error('vite-plus バージョン整合性チェックに失敗しました:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(
  `vite-plus バージョン整合性 OK: vite-plus / @voidzero-dev/vite-plus-core / overrides.vite すべて ${installedCore}`,
);
