import { Router } from 'express';
import { scrapeFeeds } from '../services/scraper.js';
import { transformArticlesAsync } from '../services/transformer.js';

export const scrapeRouter = Router();

scrapeRouter.post('/', async (_req, res) => {
  try {
    const newIds = await scrapeFeeds();
    transformArticlesAsync(newIds);
    res.json({ message: 'Scraping complete', newArticles: newIds.length });
  } catch (err) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: 'Scraping failed' });
  }
});
