import type { Article, Source, ChatMessage } from '../types';

const BASE = '/api';

export async function getSources(): Promise<Source[]> {
  const res = await fetch(`${BASE}/articles/sources`);
  if (!res.ok) throw new Error('Failed to fetch sources');
  return res.json();
}

export async function getArticles(source?: string): Promise<Article[]> {
  const url = source
    ? `${BASE}/articles?source=${encodeURIComponent(source)}`
    : `${BASE}/articles`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch articles');
  return res.json();
}

export async function getArticle(id: number): Promise<Article> {
  const res = await fetch(`${BASE}/articles/${id}`);
  if (!res.ok) throw new Error('Failed to fetch article');
  return res.json();
}

export async function triggerScrape(): Promise<{ message: string; newArticles: number }> {
  const res = await fetch(`${BASE}/scrape`, { method: 'POST' });
  if (!res.ok) throw new Error('Scraping failed');
  return res.json();
}

export async function getChatHistory(articleId: number): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE}/articles/${articleId}/chat`);
  if (!res.ok) throw new Error('Failed to fetch chat history');
  return res.json();
}

export async function* sendChatMessage(
  articleId: number,
  message: string,
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/articles/${articleId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok || !res.body) throw new Error('Chat request failed');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = JSON.parse(line.slice(6)) as { text?: string; done?: boolean; error?: string };
      if (payload.error) throw new Error(payload.error);
      if (payload.done) return;
      if (payload.text) yield payload.text;
    }
  }
}
