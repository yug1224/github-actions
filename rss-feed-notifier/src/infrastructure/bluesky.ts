/**
 * Blueskyエージェントの初期化
 */
import { BskyAgent } from 'npm:@atproto/api';
import { BLUESKY_SERVICE_URL } from '../config/constants.ts';
import { logger } from '../utils/logger.ts';
import { AuthError } from '../utils/errors.ts';

/**
 * Blueskyエージェントを初期化してログインする
 *
 * @param identifier - Blueskyアカウント識別子
 * @param password - Blueskyパスワード
 * @returns 初期化済みのBskyAgent
 * @throws {AppError} 認証に失敗した場合
 */
export async function initializeBlueskyAgent(
  identifier: string,
  password: string,
): Promise<BskyAgent> {
  try {
    const agent = new BskyAgent({ service: BLUESKY_SERVICE_URL });
    await agent.login({ identifier, password });
    logger.info('Blueskyにログインしました');
    return agent;
  } catch (error) {
    throw new AuthError(
      'Bluesky',
      error instanceof Error ? error : undefined,
    );
  }
}
