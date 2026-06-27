/**
 * RSS フィードエントリ
 */
export interface FeedEntry {
  id?: string;
  title?: { value?: string };
  links: { href?: string }[];
  published?: string | Date;
  description?: { value?: string };
}
