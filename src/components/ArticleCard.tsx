import { useNavigate } from "react-router-dom";
import type { Article } from "../types";

interface Props {
  article: Article;
}

const formatDate = (iso: string | null): string => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const ArticleCard = ({ article }: Props) => {
  const navigate = useNavigate();
  const isPending = article.transform_status === "pending";
  const isError = article.transform_status === "error";

  const title = article.fake_title ?? article.title;
  const snippet = article.fake_description ?? article.description ?? "";
  return (
    <article
      className="card"
      onClick={() => navigate(`/article/${article.id}`)}
    >
      <div className="card-meta">
        <span className="source-tag">{article.source_name}</span>
        <span className="date">{formatDate(article.published_at)}</span>
      </div>
      <h2 className="card-title">{isPending ? article.title : title}</h2>
      {isPending && (
        <p className="card-snippet pending-text">
          Generating satirical version...
        </p>
      )}
      {isError && (
        <p className="card-snippet error-text">
          Transformation failed — showing original
        </p>
      )}
      {!isPending && !isError && snippet && (
        <p className="card-snippet">
          {snippet.slice(0, 160)}
          {snippet.length > 160 ? "…" : ""}
        </p>
      )}
      {article.fake_title && <span className="satire-badge">SATIRE</span>}
    </article>
  );
};
