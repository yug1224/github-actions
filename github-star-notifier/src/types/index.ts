/**
 * アプリケーション全体で使用する型定義
 */

import { type FeedEntry } from '@mikaelporttila/rss';
import { type AtpAgent, type RichText } from '@atproto/api';

// Feed関連の型
export interface FeedItem extends FeedEntry {
  summary: string;
}

// Open Graph Protocol関連の型
export interface OpenGraphData {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: Array<{
    url: string;
    width?: number;
    height?: number;
    type?: string;
  }>;
}

// Bluesky投稿用の型
export interface BlueskyPostContent {
  richText: RichText;
}

export interface BlueskyFormatterParams {
  agent: AtpAgent;
  item: FeedItem;
}

// Webhook通知用の型
export interface WebhookMessage {
  content: string;
}

export interface WebhookFormatterParams {
  item: FeedItem;
}

// 画像処理結果
export interface ProcessedImageResult {
  mimeType?: string;
  resizedImage?: Uint8Array;
}

// Bluesky投稿パラメータ
export interface PublishToBlueskyParams {
  agent: AtpAgent;
  richText: RichText;
  title: string;
  link: string;
  mimeType?: string;
  image?: Uint8Array;
}

// Blob upload結果
export interface UploadBlobResult {
  $type: 'blob';
  ref: { $link: string };
  mimeType: string;
  size: number;
}
