import { GoogleGenAI } from '@google/genai';
import { Summary } from '../../domain/models/index.ts';
import { GEMINI_CONFIG, RETRY_CONFIG } from '../../config/constants.ts';
import { retry } from '../../utils/retry.ts';
import { logger } from '../../utils/logger.ts';

const systemInstruction = `
# Role
- あなたは、与えられた技術文書（APIドキュメント、チュートリアル、論文など）を深く理解し、その核心を捉えて簡潔に説明するエキスパートです。

# Task
- 与えられた技術文書について、以下の要件を満たす日本語の要約文を生成してください。

## 要約文の要件
- 内容: その技術や情報がどのようなもので、どんな場面で役立つ可能性があるかを具体的に記述する
- 文字数: 全体で100文字以内
- 文体:
  - 硬すぎず、砕けすぎない、自然な口語表現を用いる
  - 断定的な表現を避け、柔らかい表現を使用する
  - 「ですます」調は使用しない

## 文の構成ルール（重要）
- 必ず二文構成とし、以下のルールを厳守すること

### 形式
- 1文目と2文目の間に改行を入れる
- 句読点（。、）は使用しない
- 2文とも句読点なしで終わる

### 1文目：事実・特徴を伝える（伝聞系・推測系・印象系のいずれかで終わる）
- 伝聞系: 「〜らしい」「〜するやつ」「〜なツール」
- 推測系: 「〜かも」「〜っぽい」「〜みたい」
- 印象系: 「〜そう」「〜な印象」「〜ってところ」

### 2文目：自分の反応・評価を述べる（期待系・感想系のいずれかで終わる）
- 期待系: 「〜に期待」「〜が楽しみ」「〜を試したい」
- 感想系: 「〜が良いな」「刺さりそうかも」「気になる」「使えそうかな」「便利そう」

## バリエーションのガイドライン
- 毎回必ず異なるパターンで書いてください：

### 文頭のパターン
- 名前・特徴・機能から始める: 「Reactは〜」「Rust製で〜」「状態変化で必要な部分だけ〜」

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
- 1文目と2文目の間に改行を1つ入れてください

## 出力例（様々なパターン）
facebook/react:
状態変化で必要な部分だけ効率的に更新する宣言的UIライブラリらしい
コンポーネント設計が好きな人に刺さりそうかも

vitejs/vite:
ネイティブESモジュールを活用した爆速HMRが売りのビルドツールっぽい
開発体験の向上に期待

oxc-project/oxc:
Rust製で既存ツールより桁違いに速いJS/TSツール群らしい
パーサーやリンターを探してるなら使えそうかな

tailwindlabs/tailwindcss:
クラス名を並べるだけでスタイリングできるユーティリティファーストなCSSフレームワークみたい
効率よくUI作りたいときに便利そう

denoland/deno:
Node.jsの反省を活かしたセキュリティ重視のランタイムな印象
TypeScriptがそのまま動くのが良いな

astral-sh/ruff:
既存ツールより100倍速いPython用リンター兼フォーマッターらしい
Rust製でちょっと気になる

takaishi/tftargets:
Gitの変更差分から実行すべきTerraformディレクトリを特定するツールっぽい
CI/CDの効率化に使えそうかな
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
