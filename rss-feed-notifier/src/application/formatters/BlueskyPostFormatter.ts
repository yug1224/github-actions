/**
 * Bluesky投稿フォーマッター
 *
 * Bluesky投稿用のテキストとRichTextを生成
 */

import { AtpAgent, RichText } from 'npm:@atproto/api';
import { FeedItem } from '../../domain/models/FeedItem.ts';
import { OpenGraphData } from '../../domain/models/OpenGraphData.ts';
import { TEXT_LIMITS } from '../../config/constants.ts';
import { logger } from '../../utils/logger.ts';

/**
 * 文字列の書記素クラスタ数をカウントする
 */
function countGraphemes(text: string): number {
  return [...text].length;
}

/**
 * 文字列を書記素クラスタ単位で分割する
 */
function splitGraphemes(text: string): string[] {
  return [...text];
}

/**
 * Bluesky投稿フォーマッター
 */
export class BlueskyPostFormatter {
  constructor(private readonly agent: AtpAgent) {}

  /**
   * RichTextを作成する
   *
   * @param feedItem - フィードアイテム
   * @param ogpData - OGPデータ
   * @returns RichText
   */
  async createRichText(
    feedItem: FeedItem,
    ogpData: OpenGraphData,
  ): Promise<RichText> {
    const url = feedItem.getUrl();
    const title = ogpData.getTitle() || feedItem.getTitle() || '';

    // リンク表示テキストを作成
    const linkText = this.formatLinkText(
      url.getHostWithPath(),
    );

    // 投稿本文を作成
    const postBodyText = title ? `${linkText}\n${this.formatTitle(title)}` : linkText;

    logger.debug('Bluesky投稿テキストを作成しました', {
      linkText,
      title,
      postBodyText,
    });

    // RichTextを作成してファセットを設定
    const richText = new RichText({ text: postBodyText });
    await richText.detectFacets(this.agent);

    // リンクファセットを先頭に追加
    richText.facets = [
      {
        index: {
          byteStart: 0,
          byteEnd: new TextEncoder().encode(linkText).length,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: url.toString(),
          },
        ],
      },
      ...(richText.facets || []),
    ];

    return richText;
  }

  /**
   * リンク表示テキストをフォーマットする
   *
   * @param hostWithPath - ホスト名とパス
   * @returns フォーマットされたリンクテキスト
   */
  private formatLinkText(hostWithPath: string): string {
    const ellipsis = '...';
    const count = countGraphemes(hostWithPath);

    if (count > TEXT_LIMITS.LINK_DISPLAY_MAX_LENGTH) {
      const truncated = splitGraphemes(hostWithPath)
        .slice(0, TEXT_LIMITS.LINK_DISPLAY_ELLIPSIS_LENGTH)
        .join('');
      return truncated + ellipsis;
    }

    return hostWithPath;
  }

  /**
   * タイトルをフォーマットする
   *
   * @param title - タイトル
   * @returns フォーマットされたタイトル
   */
  private formatTitle(title: string): string {
    const ellipsis = '...';
    const count = countGraphemes(title);

    if (count > TEXT_LIMITS.TITLE_MAX_LENGTH) {
      const truncated = splitGraphemes(title)
        .slice(0, TEXT_LIMITS.TITLE_ELLIPSIS_LENGTH)
        .join('');
      return truncated + ellipsis;
    }

    return title;
  }

  /**
   * 説明文を取得する
   *
   * @param ogpData - OGPデータ
   * @param feedItem - フィードアイテム
   * @returns 説明文
   */
  getDescription(
    ogpData: OpenGraphData,
    feedItem: FeedItem,
  ): string {
    return ogpData.getDescription() || feedItem.getDescription() || '';
  }
}
