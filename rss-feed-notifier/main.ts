/**
 * RSS Feed Notifier
 *
 * RSSフィードを監視し、新着記事をBlueskyとWebhookに自動投稿する
 */

import 'jsr:@std/dotenv/load';
import { validateAndGetEnv } from './src/config/env.ts';
import { POST_TIME_END_HOUR_UTC, POST_TIME_START_HOUR_UTC } from './src/config/constants.ts';
import { logger } from './src/utils/logger.ts';
import { initializeBlueskyAgent } from './src/infrastructure/bluesky.ts';
import { createDependencies } from './src/infrastructure/dependencies.ts';
import { FetchAndNotifyUseCase } from './src/application/usecases/index.ts';

/**
 * 投稿可能な時間帯かチェックする
 *
 * @returns 投稿可能な場合true
 */
function isWithinPostingHours(): boolean {
  const nowHour = new Date().getUTCHours();
  return nowHour >= POST_TIME_START_HOUR_UTC &&
    nowHour < POST_TIME_END_HOUR_UTC;
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  logger.info('RSS Feed Notifierを開始します');

  // 環境変数の検証
  const env = validateAndGetEnv();

  // 投稿時間帯のチェック
  if (!isWithinPostingHours()) {
    const nowHour = new Date().getUTCHours();
    logger.info('投稿可能な時間帯ではありません', {
      currentHour: nowHour,
      postingHours: `${POST_TIME_START_HOUR_UTC}-${POST_TIME_END_HOUR_UTC}`,
    });
    return;
  }

  // Blueskyにログイン
  const agent = await initializeBlueskyAgent(
    env.BLUESKY_IDENTIFIER,
    env.BLUESKY_PASSWORD,
  );

  // 依存性の構築
  const dependencies = createDependencies(agent, env);

  // ユースケースの実行
  const useCase = new FetchAndNotifyUseCase(
    dependencies.feedRepository,
    dependencies.notificationRepository,
    dependencies.openGraphRepository,
    dependencies.imageRepository,
    dependencies.blueskyPostFormatter,
    dependencies.webhookMessageFormatter,
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
