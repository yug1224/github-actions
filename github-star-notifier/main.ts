import 'jsr:@std/dotenv/load';
import AtprotoAPI from 'npm:@atproto/api';
import type { AtpAgent } from 'npm:@atproto/api';
import { validateAndGetEnv } from './src/config/env.ts';
import { BLUESKY_SERVICE_URL, MAX_POST_COUNT } from './src/config/constants.ts';
import { logger } from './src/utils/logger.ts';
import { AuthError } from './src/utils/errors.ts';
import { FetchAndNotifyUseCase } from './src/application/usecases/index.ts';
import {
  ContentRepository,
  FeedRepository,
  NotificationRepository,
  SummaryService,
} from './src/infrastructure/repositories/index.ts';

/**
 * Blueskyエージェントの初期化とログイン
 */
async function initializeBlueskyAgent(identifier: string, password: string): Promise<AtpAgent> {
  try {
    const { BskyAgent } = AtprotoAPI;
    const agent = new BskyAgent({ service: BLUESKY_SERVICE_URL });
    await agent.login({ identifier, password });
    logger.info('Successfully logged in to Bluesky');
    return agent;
  } catch (error) {
    throw new AuthError('Bluesky', error instanceof Error ? error : undefined);
  }
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  // 環境変数の検証
  const env = validateAndGetEnv();

  // Blueskyにログイン
  const agent = await initializeBlueskyAgent(env.BLUESKY_IDENTIFIER, env.BLUESKY_PASSWORD);

  // リポジトリの初期化（DI）
  const feedRepo = new FeedRepository();
  const contentRepo = new ContentRepository();
  const summaryService = new SummaryService(env.GOOGLE_AI_API_KEY, env.GEMINI_MODEL);
  const notificationRepo = new NotificationRepository();

  // ユースケースの実行
  const useCase = new FetchAndNotifyUseCase(
    feedRepo,
    contentRepo,
    summaryService,
    notificationRepo,
  );

  await useCase.execute(env.RSS_URL, agent, env.WEBHOOK_URL, MAX_POST_COUNT);
}

// エントリーポイント
try {
  await main();
  Deno.exit(0);
} catch (e) {
  // エラーが発生したらログを出力して終了
  logger.error('Error occurred', e);
  Deno.exit(1);
}
