export interface Article {
  id: number;
  title: string;
  description: string | null;
  original_url: string;
  published_at: string | null;
  source_name: string;
  fake_title: string | null;
  fake_description: string | null;
  transform_status: 'pending' | 'done' | 'error' | null;
  error_message?: string | null;
}

export interface Source {
  id: number;
  name: string;
}

export interface ChatMessage {
  id: number;
  article_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
