/**
 * AI要約生成クラス
 *
 * Google Gemini を使用して技術リポジトリの要約を生成する。
 * ルールベース検証とLLM検証の二段階で品質を担保し、
 * 不合格の場合はフィードバック付きで再生成する。
 */

import { GoogleGenAI } from '@google/genai';
import { Summary } from '../../domain/models/index.ts';
import { GEMINI_CONFIG, RETRY_CONFIG, SUMMARY_RULES } from '../../config/constants.ts';
import { retry } from '../../utils/retry.ts';
import { logger } from '../../utils/logger.ts';
import { validateSummaryFormat, type ValidationResult } from './validators/summaryValidator.ts';
import { buildSummarySystemPrompt, buildSummaryUserMessage } from './prompts/summaryPromptBuilder.ts';
import { buildValidationSystemPrompt, buildValidationUserMessage } from './prompts/validationPromptBuilder.ts';

/**
 * AI要約生成クラス
 *
 * URLがある場合はurlContext/googleSearchツールでページ内容を参照し、
 * なければテキストコンテンツから要約を生成する。
 */
export class SummaryGenerator {
  private readonly ai: GoogleGenAI;
  private readonly modelName: string;

  constructor(apiKey: string, modelName: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  /**
   * テキストコンテンツから要約を生成する（検証付き）
   *
   * @param textContent - 要約対象のテキスト（空チェックに使用）
   * @param url - 元のURL（存在する場合はLLMへの入力として優先される）
   * @returns 生成された要約（Summary Value Object）。失敗時はnull
   */
  async generate(textContent: string, url?: string): Promise<Summary | null> {
    if (!textContent || textContent.trim() === '') {
      logger.warn('入力テキストが空のため要約をスキップ');
      return null;
    }

    const userMessage = buildSummaryUserMessage(url, textContent);
    const responseText = await this.generateWithValidation(userMessage, url);

    if (!responseText || responseText.trim() === '') {
      logger.warn('AIが空の応答を返却');
      return null;
    }

    try {
      return Summary.createForBluesky(responseText);
    } catch (error) {
      logger.error('Summary Value Objectの生成に失敗', error, { responseText });
      return null;
    }
  }

  /**
   * 検証付きでサマリーを生成する（ループベースで再試行）
   *
   * 1. サマリーを生成
   * 2. ルールベース検証（構造・句読点・文字数）
   * 3. LLM検証（文末パターン・自然さ）
   * 不合格の場合はフィードバックを付与して再生成する
   */
  private async generateWithValidation(userMessage: string, url?: string): Promise<string> {
    let feedback: string | undefined;
    let lastSummary = '';

    for (let attempt = 1; attempt <= SUMMARY_RULES.MAX_VALIDATION_RETRIES; attempt++) {
      logger.info('サマリー生成中', {
        attempt,
        url,
        hasFeedback: !!feedback,
      });

      const summaryText = await retry(() => this.generateSummaryText(userMessage, feedback), {
        maxRetries: RETRY_CONFIG.SUMMARY_MAX_RETRIES,
        onRetry: (error, retryAttempt) => {
          logger.warn('サマリー生成をリトライ（APIエラー）', {
            attempt,
            retryAttempt,
            error: String(error),
            url,
          });
        },
      });

      logger.info('サマリー生成完了', {
        attempt,
        url,
        length: summaryText.length,
      });
      logger.debug('生成されたサマリー', { summaryText });

      if (!summaryText || summaryText.trim() === '') {
        logger.warn('AIが空の応答を返却');
        return '';
      }

      lastSummary = summaryText;

      const ruleValidation = validateSummaryFormat(summaryText);
      if (!ruleValidation.isValid) {
        logger.warn('ルールベース検証に失敗', {
          attempt,
          errors: ruleValidation.errors,
          url,
        });
        feedback = ruleValidation.errors.join('\n');
        continue;
      }

      logger.info('ルールベース検証に合格', { attempt, url });

      const llmValidation = await this.validateWithLLM(summaryText);
      if (!llmValidation.isValid) {
        logger.warn('LLM検証に失敗', {
          attempt,
          errors: llmValidation.errors,
          url,
        });
        feedback = llmValidation.errors.join('\n');
        continue;
      }

      logger.info('LLM検証に合格', { attempt, url });
      return summaryText;
    }

    logger.warn('最大検証リトライ回数に到達、最後の結果を返却', { url });
    return lastSummary;
  }

  /**
   * サマリーを生成する（単発呼び出し、検証なし）
   */
  private async generateSummaryText(userMessage: string, previousFeedback?: string): Promise<string> {
    const tools = [{ urlContext: {} }, { googleSearch: {} }];

    const config = {
      temperature: GEMINI_CONFIG.TEMPERATURE,
      topP: GEMINI_CONFIG.TOP_P,
      topK: GEMINI_CONFIG.TOP_K,
      maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
      responseMimeType: GEMINI_CONFIG.RESPONSE_MIME_TYPE,
      tools,
      systemInstruction: [{ text: buildSummarySystemPrompt(previousFeedback) }],
    };

    const contents = [{ role: 'user' as const, parts: [{ text: userMessage }] }];

    const result = await this.ai.models.generateContent({
      model: this.modelName,
      config,
      contents,
    });

    return (result.text || '').trim();
  }

  /**
   * LLMを使用してサマリーがルールに従っているか検証する
   */
  private async validateWithLLM(summary: string): Promise<ValidationResult> {
    try {
      const config = {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: 'application/json' as const,
        systemInstruction: [{ text: buildValidationSystemPrompt() }],
      };

      const contents = [
        {
          role: 'user' as const,
          parts: [{ text: buildValidationUserMessage(summary) }],
        },
      ];

      const result = await this.ai.models.generateContent({
        model: this.modelName,
        config,
        contents,
      });

      const responseText = (result.text || '').trim();
      logger.debug('LLM検証の応答', { responseText });

      const parsed = JSON.parse(responseText);
      return {
        isValid: parsed.isValid === true,
        errors: parsed.feedback ? [parsed.feedback] : [],
      };
    } catch (error) {
      logger.warn('LLM検証に失敗、ルールベース検証の結果に委ねる', {
        error: String(error),
      });
      return { isValid: true, errors: [] };
    }
  }
}
