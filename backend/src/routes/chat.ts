import { Router } from 'express';
import OpenAI from 'openai';
import { pool } from '../db/pool.js';

export const chatRouter = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

chatRouter.get('/:articleId/chat', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, role, content, created_at FROM chat_messages
       WHERE article_id = $1 ORDER BY created_at ASC`,
      [req.params.articleId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get chat history error:', err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

chatRouter.post('/:articleId/chat', async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    const articleRes = await pool.query(
      `SELECT a.title, a.description, f.fake_title, f.fake_description
       FROM articles a LEFT JOIN fake_articles f ON f.article_id = a.id
       WHERE a.id = $1`,
      [req.params.articleId],
    );
    const article = articleRes.rows[0];
    if (!article) return res.status(404).json({ error: 'Article not found' });

    await pool.query(
      `INSERT INTO chat_messages (article_id, role, content) VALUES ($1, 'user', $2)`,
      [req.params.articleId, message],
    );

    const systemPrompt = `You are a helpful assistant for a satirical news app. The user is asking about an article.

Original title: ${article.title}
Original description: ${article.description ?? 'N/A'}

Satirical title: ${article.fake_title ?? 'Not yet generated'}
Satirical description: ${article.fake_description ?? 'Not yet generated'}

Answer questions concisely. When asked about entities, list them clearly. When asked how the article was changed, compare original vs satirical version.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    await pool.query(
      `INSERT INTO chat_messages (article_id, role, content) VALUES ($1, 'assistant', $2)`,
      [req.params.articleId, fullResponse],
    );
  } catch (err) {
    console.error('Chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message ?? 'Chat failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.end();
    }
  }
});
