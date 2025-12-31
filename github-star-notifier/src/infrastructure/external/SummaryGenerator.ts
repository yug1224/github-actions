import { GoogleGenAI } from '@google/genai';
import { Summary } from '../../domain/models/index.ts';
import { GEMINI_CONFIG, RETRY_CONFIG, VALIDATION_CONFIG } from '../../config/constants.ts';
import { retry } from '../../utils/retry.ts';
import { logger } from '../../utils/logger.ts';

/**
 * 検証結果を表すインターフェース
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * ルールベースでサマリーのフォーマットを検証する
 * 構造的なルール（二文構成、句読点、文字数）のみを検証し、
 * 文末パターンは警告のみ出力してLLM検証に任せる
 *
 * @param text - 検証対象のサマリーテキスト
 * @returns 検証結果（isValid: 検証合格可否, errors: エラーメッセージ配列）
 */
function validateSummaryFormat(text: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = text.split('\n').filter((line) => line.trim() !== '');

  // 二文構成チェック（必須）
  if (lines.length !== 2) {
    errors.push(`二文構成である必要があります（現在: ${lines.length}文）`);
  }

  // 句読点チェック（必須）
  if (/[。、]/.test(text)) {
    errors.push('句読点（。、）は使用禁止です');
  }

  // 文字数チェック（必須、書記素クラスタ単位で正確にカウント）
  // 絵文字や合字も視覚的な1文字としてカウント
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  const charCount = [...segmenter.segment(text)].length;
  if (charCount > VALIDATION_CONFIG.MAX_SUMMARY_LENGTH) {
    errors.push(
      `${VALIDATION_CONFIG.MAX_SUMMARY_LENGTH}文字以内である必要があります（現在: ${charCount}文字）`,
    );
  }

  // 1文目の文末パターンチェック（警告のみ、LLM検証に任せる）
  if (lines.length >= 1) {
    const firstLine = lines[0].trim();
    const hasValidFirstEnding = VALIDATION_CONFIG.FIRST_SENTENCE_ENDINGS.some((ending) => firstLine.endsWith(ending));
    if (!hasValidFirstEnding) {
      warnings.push(`1文目の文末が定義済みパターンに一致しません: "${firstLine.slice(-10)}"`);
    }
  }

  // 2文目の文末パターンチェック（警告のみ、LLM検証に任せる）
  if (lines.length >= 2) {
    const secondLine = lines[1].trim();
    const hasValidSecondEnding = VALIDATION_CONFIG.SECOND_SENTENCE_ENDINGS.some((ending) =>
      secondLine.endsWith(ending)
    );
    if (!hasValidSecondEnding) {
      warnings.push(`2文目の文末が定義済みパターンに一致しません: "${secondLine.slice(-10)}"`);
    }
  }

  // 警告をログ出力（再生成トリガーにはしない）
  if (warnings.length > 0) {
    logger.debug('Summary format warnings (not blocking)', { warnings });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

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

## セルフレビュー（重要）
出力する前に、以下の手順で3回セルフレビューを行ってください：

### レビュー手順
1. 要約文を生成する
2. 以下のチェックリストで検証する
3. 問題があれば修正して再度チェック
4. 3回繰り返して最終版を出力

### チェックリスト
- [ ] 二文構成になっているか？（改行で区切られた2行）
- [ ] 句読点（。、）を使っていないか？
- [ ] 100文字以内か？
- [ ] 1文目は伝聞系・推測系・印象系で終わっているか？
- [ ] 2文目は期待系・感想系で終わっているか？
- [ ] 自然な日本語になっているか？

### 注意
- セルフレビューの過程は出力しないでください
- 最終的な要約文のみを出力してください
`;

/**
 * LLM検証用のシステムプロンプト
 */
const validationSystemInstruction = `
あなたは、生成されたサマリーが指定されたルールに従っているかを厳密に検証するエキスパートです。

# 検証ルール

## 構造ルール
1. 必ず二文構成であること（改行で区切られた2行）
2. 句読点（。、）を含まないこと
3. 全体で100文字以内であること

## 1文目のルール
以下のいずれかのパターンで終わること：
- 伝聞系: 「〜らしい」「〜やつ」「〜ツール」
- 推測系: 「〜かも」「〜っぽい」「〜みたい」
- 印象系: 「〜そう」「〜印象」「〜ところ」

## 2文目のルール
以下のいずれかのパターンで終わること：
- 期待系: 「〜期待」「〜楽しみ」「〜試したい」
- 感想系: 「〜良いな」「〜かも」「〜気になる」「〜使えそう」「〜使えそうかな」「〜便利そう」「〜刺さりそうかも」

# タスク
与えられたサマリーを上記のルールに照らし合わせて検証し、結果をJSON形式で出力してください。

# 出力形式（厳守）
以下のJSON形式のみを出力してください。それ以外の説明や前置きは一切不要です。

{
  "isValid": true または false,
  "feedback": "問題がある場合は具体的な改善点を記載。問題がなければ空文字"
}
`;

/**
 * LLMを使用してサマリーがルールに従っているか検証する
 *
 * @param summary - 検証対象のサマリーテキスト
 * @param ai - GoogleGenAIインスタンス
 * @param modelName - 使用するモデル名
 * @returns 検証結果
 */
async function validateWithLLM(
  summary: string,
  ai: GoogleGenAI,
  modelName: string,
): Promise<ValidationResult> {
  try {
    const config = {
      temperature: 0.1, // 検証は低温度で安定させる
      maxOutputTokens: 500,
      responseMimeType: 'application/json',
      systemInstruction: [{ text: validationSystemInstruction }],
    };

    const contents = [
      {
        role: 'user',
        parts: [{ text: `以下のサマリーを検証してください:\n\n${summary}` }],
      },
    ];

    const result = await ai.models.generateContent({
      model: modelName,
      config,
      contents,
    });

    const responseText = (result.text || '').trim();
    logger.debug('LLM validation response', { responseText });

    const parsed = JSON.parse(responseText);
    return {
      isValid: parsed.isValid === true,
      errors: parsed.feedback ? [parsed.feedback] : [],
    };
  } catch (error) {
    logger.warn('LLM validation failed, assuming valid', { error: String(error) });
    // LLM検証が失敗した場合は、ルールベース検証の結果に任せる
    return { isValid: true, errors: [] };
  }
}

/**
 * サマリーを生成する（単発呼び出し、検証なし）
 *
 * @param ai - GoogleGenAIインスタンス
 * @param modelName - 使用するモデル名
 * @param prompt - プロンプト（URLまたはテキスト）
 * @param previousFeedback - 前回の検証フィードバック（再生成時に使用）
 * @returns 生成されたサマリーテキスト
 */
async function generateSummaryText(
  ai: GoogleGenAI,
  modelName: string,
  prompt: string,
  previousFeedback?: string,
): Promise<string> {
  // toolsを設定（urlContextとgoogleSearchを有効化）
  const tools = [{ urlContext: {} }, { googleSearch: {} }];

  // フィードバックがある場合はシステムプロンプトに追記
  let finalSystemInstruction = systemInstruction;
  if (previousFeedback) {
    finalSystemInstruction +=
      `\n\n# 重要な修正指示\n前回の出力に以下の問題がありました。必ず修正してください:\n${previousFeedback}`;
  }

  const config = {
    temperature: GEMINI_CONFIG.TEMPERATURE,
    topP: GEMINI_CONFIG.TOP_P,
    topK: GEMINI_CONFIG.TOP_K,
    maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
    responseMimeType: GEMINI_CONFIG.RESPONSE_MIME_TYPE,
    tools,
    systemInstruction: [{ text: finalSystemInstruction }],
  };

  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  const result = await ai.models.generateContent({
    model: modelName,
    config,
    contents,
  });

  return (result.text || '').trim();
}

/**
 * 検証付きでサマリーを生成する（再帰的に再試行）
 *
 * @param ai - GoogleGenAIインスタンス
 * @param modelName - 使用するモデル名
 * @param prompt - プロンプト（URLまたはテキスト）
 * @param url - ログ用のURL
 * @param previousFeedback - 前回の検証フィードバック
 * @param attempt - 現在の試行回数
 * @returns 検証済みのサマリーテキスト
 */
async function generateWithValidation(
  ai: GoogleGenAI,
  modelName: string,
  prompt: string,
  url?: string,
  previousFeedback?: string,
  attempt: number = 1,
): Promise<string> {
  logger.info('Generating summary', { attempt, url, hasFeedback: !!previousFeedback });

  // Step 1: サマリー生成
  const summaryText = await retry(
    () => generateSummaryText(ai, modelName, prompt, previousFeedback),
    {
      maxRetries: RETRY_CONFIG.SUMMARY_MAX_RETRIES,
      onRetry: (error, retryAttempt) => {
        logger.warn('Retrying summary generation (API error)', {
          attempt,
          retryAttempt,
          error: String(error),
          url,
        });
      },
    },
  );

  logger.info('Summary generated', { attempt, url, length: summaryText.length });
  logger.debug('Generated summary text', { summaryText });

  // 空の応答の場合は再試行しない
  if (!summaryText || summaryText.trim() === '') {
    logger.warn('AI returned empty response');
    return '';
  }

  // Step 2: ルールベース検証
  const ruleValidation = validateSummaryFormat(summaryText);
  if (!ruleValidation.isValid) {
    logger.warn('Rule-based validation failed', {
      attempt,
      errors: ruleValidation.errors,
      url,
    });

    // 最大再試行回数に達した場合は最後の結果を返す
    if (attempt >= VALIDATION_CONFIG.MAX_VALIDATION_RETRIES) {
      logger.warn('Max validation retries reached, returning last result', {
        attempt,
        url,
      });
      return summaryText;
    }

    // フィードバック付きで再生成
    const feedback = ruleValidation.errors.join('\n');
    return generateWithValidation(ai, modelName, prompt, url, feedback, attempt + 1);
  }

  logger.info('Rule-based validation passed', { attempt, url });

  // Step 3: LLM検証
  const llmValidation = await validateWithLLM(summaryText, ai, modelName);
  if (!llmValidation.isValid) {
    logger.warn('LLM validation failed', {
      attempt,
      errors: llmValidation.errors,
      url,
    });

    // 最大再試行回数に達した場合は最後の結果を返す
    if (attempt >= VALIDATION_CONFIG.MAX_VALIDATION_RETRIES) {
      logger.warn('Max validation retries reached, returning last result', {
        attempt,
        url,
      });
      return summaryText;
    }

    // フィードバック付きで再生成
    const feedback = llmValidation.errors.join('\n');
    return generateWithValidation(ai, modelName, prompt, url, feedback, attempt + 1);
  }

  logger.info('LLM validation passed', { attempt, url });
  return summaryText;
}

/**
 * AIを使用して要約を生成する（検証付き）
 *
 * @param textContent - 要約対象のテキストコンテンツ
 * @param apiKey - Gemini APIキー
 * @param modelName - 使用するモデル名
 * @param url - 元のURL（ログ記録用）
 * @returns 生成された要約（Summary Value Object）。失敗時はnullを返す
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

  const ai = new GoogleGenAI({ apiKey });

  // URLのみをプロンプトとして使用
  const prompt = url || textContent;

  // 検証付きで生成
  const responseText = await generateWithValidation(ai, modelName, prompt, url);

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
