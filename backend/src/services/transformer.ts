import OpenAI from 'openai';
import { pool } from '../db/pool.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const transformArticle = async (articleId: number): Promise<void> => {
  const res = await pool.query<{ title: string; description: string | null }>(
    'SELECT title, description FROM articles WHERE id = $1',
    [articleId],
  );
  const article = res.rows[0];
  if (!article) return;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Transform this news article into a satirical/fake version. Make it humorous and absurd while keeping it recognizable. Return only a JSON object with keys "fake_title" and "fake_description".

Original title: ${article.title}
Original description: ${article.description ?? 'No description provided'}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content;
    if (!raw) throw new Error('Empty response from OpenAI');

    const { fake_title, fake_description } = JSON.parse(raw) as {
      fake_title: string;
      fake_description: string;
    };

    await pool.query(
      `UPDATE fake_articles
       SET fake_title = $1, fake_description = $2, status = 'done', updated_at = NOW()
       WHERE article_id = $3`,
      [fake_title, fake_description, articleId],
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Transform failed for article ${articleId}:`, msg);
    await pool.query(
      `UPDATE fake_articles SET status = 'error', error_message = $1, updated_at = NOW()
       WHERE article_id = $2`,
      [msg, articleId],
    );
  }
};

export const transformArticlesAsync = (articleIds: number[]): void => {
  for (const id of articleIds) {
    transformArticle(id).catch(console.error);
  }
};

export const retransformPending = async (): Promise<void> => {
  const res = await pool.query<{ article_id: number }>(
    `SELECT article_id FROM fake_articles WHERE status = 'pending'`,
  );
  transformArticlesAsync(res.rows.map((r) => r.article_id));
};
