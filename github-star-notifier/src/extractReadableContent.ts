import { JSDOM } from 'npm:jsdom';
import { Readability } from 'npm:@mozilla/readability';

export default async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.textContent) {
      return article.textContent.trim();
    } else {
      console.warn(`Readability could not parse content from ${url}`);
      return null;
    }
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error);
    return null;
  }
};
