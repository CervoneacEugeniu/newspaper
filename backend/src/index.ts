import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { initDb } from './db/init.js';
import { scrapeRouter } from './routes/scrape.js';
import { articlesRouter } from './routes/articles.js';
import { chatRouter } from './routes/chat.js';
import { scrapeFeeds } from './services/scraper.js';
import { transformArticlesAsync, retransformPending } from './services/transformer.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/scrape', scrapeRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/articles', chatRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const start = async () => {
  for (let i = 0; i < 15; i++) {
    try {
      await initDb();
      break;
    } catch {
      console.log(`Waiting for database... (${i + 1}/15)`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  await retransformPending();

  cron.schedule('*/30 * * * *', async () => {
    console.log('Running scheduled scrape...');
    const ids = await scrapeFeeds();
    transformArticlesAsync(ids);
  });

  app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
};

start().catch(console.error);
