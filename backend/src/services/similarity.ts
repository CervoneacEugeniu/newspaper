import OpenAI from 'openai';
import { pool } from '../db/pool.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DIMENSIONS = 512;
const COSINE_DISTANCE_THRESHOLD = 0.15; // below this = near-duplicate

const toVectorLiteral = (embedding: number[]): string => `[${embedding.join(',')}]`;

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // stay within token limit
    dimensions: DIMENSIONS,
  });
  return res.data[0].embedding;
};

export const isSimilarArticleExists = async (embedding: number[]): Promise<boolean> => {
  const res = await pool.query<{ id: number }>(
    `SELECT id FROM articles
     WHERE embedding IS NOT NULL
     AND embedding <=> $1::vector < $2
     LIMIT 1`,
    [toVectorLiteral(embedding), COSINE_DISTANCE_THRESHOLD],
  );
  return res.rows.length > 0;
};

export const storeEmbedding = async (articleId: number, embedding: number[]): Promise<void> => {
  await pool.query(
    `UPDATE articles SET embedding = $1::vector WHERE id = $2`,
    [toVectorLiteral(embedding), articleId],
  );
};
