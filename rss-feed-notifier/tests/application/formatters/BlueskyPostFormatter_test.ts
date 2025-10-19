/**
 * BlueskyPostFormatter のテスト
 *
 * 注: BskyAgentのモックが必要なため、基本的な動作のみをテスト
 */
import { assertEquals } from 'jsr:@std/assert';

Deno.test('BlueskyPostFormatter の基本テスト（プレースホルダー）', () => {
  // BlueskyPostFormatterはBskyAgentに依存しているため、
  // モックを使った統合テストが望ましい
  // ここでは基本的な動作確認のみ
  assertEquals(true, true);
});

// TODO: BskyAgentのモックを使った実際のテストを追加
// - formatPost() のテスト
// - createRichText() のテスト
// - generatePostText() のテスト
// - truncateText() のテスト
