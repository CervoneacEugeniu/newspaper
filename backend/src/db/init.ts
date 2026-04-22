import { pool } from "./pool.js";

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rss_url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sources (name, rss_url) VALUES
  ('New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'),
  ('NPR News', 'https://feeds.npr.org/1001/rss.xml'),
  ('The Guardian', 'https://www.theguardian.com/world/rss')
ON CONFLICT (rss_url) DO NOTHING;

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id),
  title TEXT NOT NULL,
  description TEXT,
  original_url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ,
  embedding vector(512),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS articles_embedding_idx ON articles
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

CREATE TABLE IF NOT EXISTS fake_articles (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) UNIQUE,
  fake_title TEXT,
  fake_description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id),
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export const initDb = async (): Promise<void> => {
  await pool.query(SCHEMA);
  console.log("Database schema ready");
};
