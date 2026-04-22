import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatHistory, sendChatMessage } from '../api/client';
import type { ChatMessage } from '../types';

interface Props {
  articleId: number;
}

const SUGGESTIONS = [
  'Summarize this article',
  'What are the key entities mentioned?',
  'How was the original article changed?',
];

export const ChatPanel = ({ articleId }: Props) => {
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const nextId = () => ++idRef.current;

  const { data: messages = [], isError } = useQuery({
    queryKey: ['chat', articleId],
    queryFn: () => getChatHistory(articleId),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamBuffer]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    setInput('');
    setStreaming(true);
    setStreamBuffer('');

    const userMsg: ChatMessage = {
      id: nextId(),
      article_id: articleId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    qc.setQueryData<ChatMessage[]>(['chat', articleId], (prev = []) => [...prev, userMsg]);

    let full = '';
    try {
      for await (const chunk of sendChatMessage(articleId, text)) {
        full += chunk;
        setStreamBuffer(full);
      }
    } catch {
      full = 'Sorry, something went wrong. Please try again.';
    }

    const assistantMsg: ChatMessage = {
      id: nextId(),
      article_id: articleId,
      role: 'assistant',
      content: full,
      created_at: new Date().toISOString(),
    };
    qc.setQueryData<ChatMessage[]>(['chat', articleId], (prev = []) => [...prev, assistantMsg]);
    setStreamBuffer('');
    setStreaming(false);
  };

  return (
    <div className="chat-panel">
      <h3 className="chat-title">Ask about this article</h3>

      <div className="chat-messages">
        {messages.length === 0 && !streaming && !isError && (
          <p className="chat-empty">Ask a question or pick a suggestion below.</p>
        )}
        {isError && (
          <p className="chat-empty error-text">Failed to load chat history.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.role}`}>
            <span className="chat-role">{m.role === 'user' ? 'You' : 'AI'}</span>
            <p>{m.content}</p>
          </div>
        ))}
        {streaming && streamBuffer && (
          <div className="chat-bubble assistant streaming">
            <span className="chat-role">AI</span>
            <p>{streamBuffer}<span className="cursor">|</span></p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="suggestion-btn" onClick={() => send(s)} disabled={streaming}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="chat-input-row"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this article..."
          disabled={streaming}
        />
        <button className="chat-send" type="submit" disabled={streaming || !input.trim()}>
          {streaming ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
