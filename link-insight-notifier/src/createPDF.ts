import { createWriteStream, writeFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import puppeteer, { type Browser } from 'puppeteer-core';
import { abortable } from './utils/abortable.ts';

async function writeResponseBodyToFile(response: Response, path: string): Promise<void> {
  if (!response.body) return;
  await pipeline(Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]), createWriteStream(path));
}

export default async (url: string, path: string) => {
  const retry = async (retryCount = 0) => {
    let browser: Browser | undefined;
    try {
      const c = new AbortController();

      const timer = setTimeout(
        () => {
          console.log('Timeout createPDF');
          return c.abort();
        },
        1000 * 60 * 5,
      );

      await abortable(
        (async () => {
          if (url.endsWith('.pdf')) {
            // pdfファイルの場合は、そのまま保存する
            const response = await fetch(url);
            await writeResponseBodyToFile(response, path);
            return;
          }

          browser = await puppeteer.launch(
            process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' },
          );
          const page = await browser.newPage();
          page.setDefaultNavigationTimeout(1000 * 60 * 3);
          page.setDefaultTimeout(1000 * 60 * 3);
          await page.goto(url, { waitUntil: 'load' });

          if (url.startsWith('https://speakerdeck.com')) {
            // SpeakerDeckの場合は、PDFをダウンロードする
            let href = '';
            try {
              href = (await page.$eval('a[title="Download PDF"]', (el) => el.getAttribute('href'))) || '';
            } catch {
              console.log('href not found');
            }
            // hrefが存在しない場合は早期リターンする
            if (!href) return;

            const response = await fetch(href);
            await writeResponseBodyToFile(response, path);
          } else if (url.startsWith('https://www.docswell.com')) {
            // docswellの場合は、PDFをダウンロードする
            let href = '';
            try {
              href = await page.$eval('a[href$="download"]', (el) => el.getAttribute('href') || '');
            } catch {
              console.log('href not found');
            }
            // hrefが存在しない場合は早期リターンする
            if (!href) return;

            const response = await fetch(href);
            await writeResponseBodyToFile(response, path);
          } else {
            // Webページの場合は、PDF化する
            const pdf = await page.pdf({
              // paperWidth: 33.1,
              // paperHeight: 46.8,
              format: 'A0',
            });
            writeFileSync(path, pdf);
          }
          await browser.close();
        })(),
        c.signal,
      );

      console.log('Success createPDF');
      clearTimeout(timer);
      return;
    } catch (e) {
      console.error(e);
      if (browser) {
        await browser.close();
      }

      if (retryCount >= 5) {
        console.log('Failed createPDF');
        return;
      }

      // リトライ処理
      console.log(`Retry createPDF`);
      await retry(retryCount + 1);
      return;
    }
  };
  await retry();
  return;
};
