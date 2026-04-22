import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getArticle } from "../api/client";
import { ChatPanel } from "../components/ChatPanel";

const formatDate = (iso: string | null): string => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const ArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showOriginal, setShowOriginal] = useState(false);

  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["article", id],
    queryFn: () => getArticle(Number(id)),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.transform_status === "pending" ? 3000 : false,
  });

  if (isLoading) return <div className="loading-page">Loading...</div>;
  if (isError || !article) {
    navigate("/404", { replace: true });
    return null;
  }

  const isPending = article.transform_status === "pending";
  const displayTitle =
    showOriginal || !article.fake_title ? article.title : article.fake_title;
  const displayBody =
    showOriginal || !article.fake_description
      ? (article.description ?? "No description available.")
      : article.fake_description;

  return (
    <div className="article-page">
      <div className="article-main">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to feed
        </button>
        <div className="article-header">
          <span className="source-tag">{article.source_name}</span>
          <span className="date">{formatDate(article.published_at)}</span>
        </div>
        <h1 className="article-title">{displayTitle}</h1>
        {isPending && (
          <div className="pending-banner">Generating satirical version...</div>
        )}
        {article.fake_title && !isPending && (
          <div className="toggle-bar">
            <button
              className={`toggle-btn${!showOriginal ? " active" : ""}`}
              onClick={() => setShowOriginal(false)}
            >
              Satirical Version
            </button>
            <button
              className={`toggle-btn${showOriginal ? " active" : ""}`}
              onClick={() => setShowOriginal(true)}
            >
              Original Article
            </button>
          </div>
        )}
        <div className="article-body">
          <p>{displayBody}</p>
        </div>

        {!showOriginal && (
          <div className="original-link">
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read original on {article.source_name} →
            </a>
          </div>
        )}
      </div>

      <aside className="article-sidebar">
        <ChatPanel articleId={article.id} />
      </aside>
    </div>
  );
};
