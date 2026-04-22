import { Router } from 'express';
import { pool } from '../db/pool.js';

export const articlesRouter = Router();

articlesRouter.get('/sources', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM sources ORDER BY name');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

articlesRouter.get('/', async (req, res) => {
  try {
    const { source } = req.query as { source?: string };
    const params: unknown[] = [];
    const where = source ? (params.push(source), 'WHERE s.name = $1') : '';

    const result = await pool.query(
      `SELECT
         a.id, a.title, a.description, a.original_url, a.published_at,
         s.name AS source_name,
         f.fake_title, f.fake_description, f.status AS transform_status
       FROM articles a
       JOIN sources s ON a.source_id = s.id
       LEFT JOIN fake_articles f ON f.article_id = a.id
       ${where}
       ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
       LIMIT 100`,
      params,
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

articlesRouter.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         a.id, a.title, a.description, a.original_url, a.published_at,
         s.name AS source_name,
         f.fake_title, f.fake_description, f.status AS transform_status, f.error_message
       FROM articles a
       JOIN sources s ON a.source_id = s.id
       LEFT JOIN fake_articles f ON f.article_id = a.id
       WHERE a.id = $1`,
      [req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});
