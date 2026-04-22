import RssParser from 'rss-parser';
import { pool } from '../db/pool.js';
import { generateEmbedding, isSimilarArticleExists, storeEmbedding } from './similarity.js';

const parser = new RssParser();

const FEEDS = [
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
  { url: 'https://feeds.npr.org/1001/rss.xml' },
  { url: 'https://www.theguardian.com/world/rss' },
];

export const scrapeFeeds = async (): Promise<number[]> => {
  const newArticleIds: number[] = [];

  for (const feed of FEEDS) {
    try {
      const sourceRes = await pool.query('SELECT id FROM sources WHERE rss_url = $1', [feed.url]);
      const sourceId: number | undefined = sourceRes.rows[0]?.id;
      if (!sourceId) continue;

      const parsed = await parser.parseURL(feed.url);

      for (const item of parsed.items) {
        const title = item.title?.trim();
        const description = (item.contentSnippet ?? item.summary ?? '').trim() || null;
        const url = item.link?.trim();
        const publishedAt = item.pubDate ? new Date(item.pubDate) : null;

        if (!title || !url) continue;

        try {
          // Try similarity check — if OpenAI is unavailable, skip it and insert anyway
          let embedding: number[] | null = null;
          try {
            const text = `${title} ${description ?? ''}`.trim();
            embedding = await generateEmbedding(text);
            const isDuplicate = await isSimilarArticleExists(embedding);
            if (isDuplicate) {
              console.log(`Skipping near-duplicate: "${title}"`);
              continue;
            }
          } catch {
            console.warn(`Similarity check skipped for "${title}" — OpenAI unavailable`);
          }

          const result = await pool.query<{ id: number }>(
            `INSERT INTO articles (source_id, title, description, original_url, published_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (original_url) DO NOTHING
             RETURNING id`,
            [sourceId, title, description, url, publishedAt],
          );

          if (result.rows[0]) {
            const articleId = result.rows[0].id;

            await Promise.all([
              embedding ? storeEmbedding(articleId, embedding) : Promise.resolve(),
              pool.query(
                `INSERT INTO fake_articles (article_id, status)
                 VALUES ($1, 'pending') ON CONFLICT (article_id) DO NOTHING`,
                [articleId],
              ),
            ]);

            newArticleIds.push(articleId);
          }
        } catch (err) {
          console.error(`Failed to process article "${title}":`, err);
        }
      }
    } catch (err) {
      console.error(`Failed to scrape ${feed.url}:`, err);
    }
  }

  console.log(`Scraped ${newArticleIds.length} new articles`);
  return newArticleIds;
};
