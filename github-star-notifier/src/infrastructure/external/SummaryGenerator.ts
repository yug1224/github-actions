import { GoogleGenAI } from '@google/genai';
import { Summary } from '../../domain/models/index.ts';
import { GEMINI_CONFIG, RETRY_CONFIG } from '../../config/constants.ts';
import { retry } from '../../utils/retry.ts';
import { logger } from '../../utils/logger.ts';

const systemInstruction = `
# Role
あなたは、与えられた技術文書（APIドキュメント、チュートリアル、論文など）を深く理解し、その核心を捉えて簡潔に説明するエキスパートです。

# Task
与えられた技術文書について、以下の要件を満たす日本語の要約文を生成してください。

## 要約文の要件
- 内容: その技術や情報がどのようなもので、どんな場面で役立つ可能性があるかを具体的に記述する
- 文字数: 全体で100文字以内
- 文体:
  - 硬すぎず、砕けすぎない、自然な口語表現を用いる
  - 断定的な表現を避け、柔らかい表現を使用する
  - 「ですます」調は使用しない

## バリエーションのガイドライン（重要）
毎回異なるパターンで書いてください。以下の要素をランダムに組み合わせること：

### 文頭のパターン
- 名前から始める: 「Reactは〜」「Viteって〜」
- 用途から始める: 「高速ビルドが欲しいなら〜」「型安全にこだわるなら〜」
- 特徴から始める: 「爆速で動く〜」「シンプルさが売りの〜」
- 感想から始める: 「これは良さげ、〜」「面白そうなやつ、〜」

### 文末表現のバリエーション
- 伝聞系: 「〜らしい」「〜だとか」「〜なんだって」「〜って話」
- 推測系: 「〜かも」「〜っぽい」「〜みたい」「〜感じ」「〜雰囲気」
- 印象系: 「〜そう」「〜な印象」「〜ってところかな」
- 期待系: 「〜に期待」「〜が楽しみ」「〜を試したい」
- 感想系: 「〜と思った」「〜なのが良い」「〜が刺さる」

### 文の構造パターン
- 説明型: 「Xは〜する〇〇」
- 比較型: 「既存の〇〇より△△」「〇〇の代替として」
- 用途型: 「〇〇したいときに便利な△△」
- 特化型: 「△△向けの〇〇」「△△に特化した〇〇」
- 発見型: 「〇〇できるのが面白い」「△△という発想が新しい」

## 出力形式の制約（重要）
- 要約文のみを出力してください
- 前置き（「要約すると〜」「以下のような〜」など）は不要です
- 説明文や補足は一切不要です
- 改行も不要です

## 出力例（様々なパターン）
facebook/react:
Reactは状態変化で必要な部分だけを効率的に更新する宣言的UIを作れるらしい。コンポーネント設計が好きな人に刺さりそう。

vitejs/vite:
爆速HMRが売りのビルドツールで、ネイティブESモジュールを活用してるっぽい。開発体験の向上に期待。

oxc-project/oxc:
Rust製のJS/TSツール群で既存ツールより桁違いに速いらしい。パーサーやリンターが欲しいなら試す価値ありそう。

tailwindlabs/tailwindcss:
ユーティリティファーストなCSSフレームワークで、クラス名を並べるだけでスタイリングできるのが楽って話。

denoland/deno:
Node.jsの反省を活かしたランタイムで、TypeScriptがそのまま動くのが便利みたい。セキュリティ重視な設計も良い感じ。

astral-sh/ruff:
Python用の超高速リンター兼フォーマッター。Rust製で既存ツールより100倍速いとか、ちょっと気になる。
`;

/**
 * AIを使用して要約を生成する
 *
 * @param textContent - 要約対象のテキストコンテンツ
 * @param apiKey - Gemini APIキー
 * @param modelName - 使用するモデル名
 * @param url - 元のURL（ログ記録用）
 * @returns 生成された要約（Summary Value Object）。失敗時は空の要約を返す
 */
export default async (
  textContent: string,
  apiKey: string,
  modelName: string,
  url?: string,
): Promise<Summary | null> => {
  if (!textContent || textContent.trim() === '') {
    logger.warn('Input textContent is empty for summary. Returning null.');
    return null;
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const responseText = await retry(
    async () => {
      // toolsを設定（urlContextとgoogleSearchを有効化）
      const tools = [
        { urlContext: {} },
        { googleSearch: {} },
      ];

      const config = {
        temperature: GEMINI_CONFIG.TEMPERATURE,
        topP: GEMINI_CONFIG.TOP_P,
        topK: GEMINI_CONFIG.TOP_K,
        maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
        responseMimeType: GEMINI_CONFIG.RESPONSE_MIME_TYPE,
        tools,
        systemInstruction: [
          {
            text: systemInstruction,
          },
        ],
      };

      // URLのみをプロンプトとして使用
      const prompt = url || textContent;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      const result = await ai.models.generateContent({
        model: modelName,
        config,
        contents,
      });

      const responseText = (result.text || '').trim();
      logger.info('Successfully created summary', { url, length: responseText.length });
      logger.debug('Summary text', { responseText });
      return responseText;
    },
    {
      maxRetries: RETRY_CONFIG.SUMMARY_MAX_RETRIES,
      onRetry: (error, attempt) => {
        logger.warn('Retrying summary creation', { attempt, error: String(error), url });
      },
    },
  );

  // 空の応答の場合はnullを返す
  if (!responseText || responseText.trim() === '') {
    logger.warn('AI returned empty response. Returning null.');
    return null;
  }

  // Summary Value Objectを生成（Bluesky用に短縮）
  try {
    return Summary.createForBluesky(responseText);
  } catch (error) {
    logger.error('Failed to create Summary value object', error, { responseText });
    return null;
  }
};
