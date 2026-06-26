/**
 * RSS Feed Notifier
 *
 * RSSフィードを監視し、新着記事をBlueskyに自動投稿する
 */

import '@std/dotenv';
import { validateAndGetEnv } from './src/config/env.ts';
import { logger } from './src/utils/logger.ts';
import { initializeBlueskyAgent } from './src/infrastructure/bluesky.ts';
import { createDependencies } from './src/infrastructure/dependencies.ts';
import { FetchAndNotifyUseCase } from './src/application/usecases/index.ts';

/**
 * メイン処理
 */
async function main(): Promise<void> {
  logger.info('RSS Feed Notifierを開始します');

  // 環境変数の検証
  const env = validateAndGetEnv();

  // Blueskyにログイン
  const agent = await initializeBlueskyAgent(
    env.BLUESKY_IDENTIFIER,
    env.BLUESKY_PASSWORD,
  );

  // 依存性の構築
  const dependencies = createDependencies(agent);

  // ユースケースの実行
  const useCase = new FetchAndNotifyUseCase(
    dependencies.feedRepository,
    dependencies.notificationRepository,
    dependencies.openGraphRepository,
    dependencies.imageRepository,
    dependencies.blueskyPostFormatter,
  );

  await useCase.execute(env.RSS_URL);

  logger.info('RSS Feed Notifierが正常に完了しました');
}

// エントリーポイント
try {
  await main();
  Deno.exit(0);
} catch (error: unknown) {
  logger.error('メイン処理でエラーが発生しました', error);
  Deno.exit(1);
}
