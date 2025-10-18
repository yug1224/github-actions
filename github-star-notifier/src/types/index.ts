/**
 * アプリケーション全体で使用する型定義
 */

import { type FeedEntry } from 'jsr:@mikaelporttila/rss';
import { type AtpAgent, type RichText } from 'npm:@atproto/api';

// Feed関連の型
export interface FeedItem extends FeedEntry {
  summary: string;
}

// OGP関連の型
export interface OgpResult {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: Array<{
    url: string;
    width?: number;
    height?: number;
    type?: string;
  }>;
}

// Bluesky投稿用プロパティ
export interface BlueskyProps {
  bskyText: RichText;
}

export interface CreateBlueskyPropsParams {
  agent: AtpAgent;
  item: FeedItem;
}

// X投稿用プロパティ
export interface XProps {
  xText: string;
}

export interface CreateXPropsParams {
  item: FeedItem;
}

// 画像リサイズ結果
export interface ResizedImageResult {
  mimeType?: string;
  resizedImage?: Uint8Array;
}

// Bluesky投稿パラメータ
export interface PostBlueskyParams {
  agent: AtpAgent;
  rt: RichText;
  title: string;
  link: string;
  description: string;
  mimeType?: string;
  image?: Uint8Array;
}

// Blob upload結果
export interface UploadBlobResult {
  $type?: 'blob';
  ref?: { $link: string };
  mimeType?: string;
  size?: number;
}
