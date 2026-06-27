/**
 * サマリーフォーマット検証
 *
 * ルールベースでサマリーの構造的な正しさを検証する純粋関数群。
 * ルール定義は SUMMARY_RULES（constants.ts）を Single Source of Truth とする。
 */

import { SUMMARY_RULES } from '../../../config/constants.ts';
import { logger } from '../../../utils/logger.ts';

/**
 * 検証結果を表すインターフェース
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * カテゴリ別の文末パターンをフラットな配列に変換する
 */
export function flattenEndingPatterns(categories: Record<string, readonly string[]>): string[] {
  return Object.values(categories).flat();
}

/**
 * ルールベースでサマリーのフォーマットを検証する
 *
 * 構造的なルール（二文構成、句読点、文字数）のみを検証し、
 * 文末パターンは警告のみ出力してLLM検証に任せる
 *
 * @param text - 検証対象のサマリーテキスト
 * @returns 検証結果（isValid: 検証合格可否, errors: エラーメッセージ配列）
 */
export function validateSummaryFormat(text: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = text.split('\n').filter((line) => line.trim() !== '');

  if (lines.length !== 2) {
    errors.push(`二文構成である必要があります（現在: ${lines.length}文）`);
  }

  if (/[。、]/.test(text)) {
    errors.push('句読点（。、）は使用禁止です');
  }

  // 書記素クラスタ単位で正確にカウント（絵文字や合字も視覚的な1文字として扱う）
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  const charCount = [...segmenter.segment(text)].length;
  if (charCount > SUMMARY_RULES.MAX_LENGTH) {
    errors.push(`${SUMMARY_RULES.MAX_LENGTH}文字以内である必要があります（現在: ${charCount}文字）`);
  }

  const firstEndings = flattenEndingPatterns(SUMMARY_RULES.FIRST_SENTENCE_ENDINGS);
  const secondEndings = flattenEndingPatterns(SUMMARY_RULES.SECOND_SENTENCE_ENDINGS);

  if (lines.length >= 1) {
    const firstLine = lines[0].trim();
    const hasValidFirstEnding = firstEndings.some((ending) => firstLine.endsWith(ending));
    if (!hasValidFirstEnding) {
      warnings.push(`1文目の文末が定義済みパターンに一致しません: "${firstLine.slice(-10)}"`);
    }
  }

  if (lines.length >= 2) {
    const secondLine = lines[1].trim();
    const hasValidSecondEnding = secondEndings.some((ending) => secondLine.endsWith(ending));
    if (!hasValidSecondEnding) {
      warnings.push(`2文目の文末が定義済みパターンに一致しません: "${secondLine.slice(-10)}"`);
    }
  }

  if (warnings.length > 0) {
    logger.debug('Summary format warnings (not blocking)', { warnings });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
