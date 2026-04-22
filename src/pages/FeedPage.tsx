import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArticles, getSources, triggerScrape } from '../api/client';
import { ArticleCard } from '../components/ArticleCard';
import { SourceFilter } from '../components/SourceFilter';

export const FeedPage = () => {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
  });

  const { data: articles = [], isLoading, isError } = useQuery({
    queryKey: ['articles', selectedSource],
    queryFn: () => getArticles(selectedSource ?? undefined),
    refetchInterval: (query) =>
      query.state.data?.some((a) => a.transform_status === 'pending') ? 4000 : false,
  });

  const scrape = useMutation({
    mutationFn: triggerScrape,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });

  return (
    <div className="feed-page">
      <header className="site-header">
        <h1 className="site-title">The Onion Times</h1>
        <p className="site-subtitle">Real news. Fake headlines. 100% absurd.</p>
        <button
          className="scrape-btn"
          onClick={() => scrape.mutate()}
          disabled={scrape.isPending}
        >
          {scrape.isPending ? 'Scraping...' : 'Fetch Latest News'}
        </button>
        {scrape.isSuccess && (
          <p className="scrape-msg">
            Done — {scrape.data.newArticles} new articles added. Transformations running in background.
          </p>
        )}
        {scrape.isError && (
          <p className="scrape-msg error-text">Scraping failed. Check backend logs.</p>
        )}
      </header>

      <SourceFilter sources={sources} selected={selectedSource} onChange={setSelectedSource} />

      {isLoading ? (
        <p className="loading">Loading articles...</p>
      ) : isError ? (
        <p className="error-text" style={{ textAlign: 'center', padding: '2rem' }}>
          Failed to load articles. Is the backend running?
        </p>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <p>No articles yet. Click "Fetch Latest News" to get started.</p>
        </div>
      ) : (
        <div className="article-grid">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
};
