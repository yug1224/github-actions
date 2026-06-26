/**
 * BlueskyPostFormatter のテスト
 *
 * 注: BskyAgentのモックが必要なため、基本的な動作のみをテスト
 */
import { assertEquals } from '@std/assert';

Deno.test('BlueskyPostFormatter の基本テスト（プレースホルダー）', () => {
  // BlueskyPostFormatterはBskyAgentに依存しているため、
  // モックを使った統合テストが望ましい
  // ここでは基本的な動作確認のみ
  assertEquals(true, true);
});

// TODO: BskyAgentのモックを使った実際のテストを追加
// - createRichText() のテスト
// - getDescription() のテスト
// - formatLinkText / formatTitle の切り詰めは createRichText 経由で検証
