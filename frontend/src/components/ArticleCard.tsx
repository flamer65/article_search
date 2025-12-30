import { Link } from "react-router-dom";
import type { Article } from "../services/api";

interface ArticleCardProps {
  article: Article;
}

/**
 * Card component for displaying an article in the grid.
 * Shows badge (original/enhanced), title, excerpt, tags, and author info.
 * Links to the article detail page.
 */
export function ArticleCard({ article }: ArticleCardProps) {
  /** Formats ISO date string to readable format */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /** Extracts initials from author name for avatar */
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Link
      to={`/article/${article.id}`}
      className={`article-card ${article.isEnhanced ? "enhanced" : ""}`}
    >
      {/* Badge: Original or Enhanced */}
      <span
        className={`article-badge ${
          article.isEnhanced ? "badge-enhanced" : "badge-original"
        }`}
      >
        {article.isEnhanced ? "✨ Enhanced" : "📄 Original"}
      </span>

      <h3 className="article-title">{article.title}</h3>

      <p className="article-excerpt">
        {article.excerpt || article.content.substring(0, 150) + "..."}
      </p>

      {/* Tags (max 3 shown) */}
      {article.tags.length > 0 && (
        <div className="article-tags">
          {article.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span className="tag">+{article.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Author and date */}
      <div className="article-meta">
        <div className="article-author">
          <span className="author-avatar">{getInitials(article.author)}</span>
          <span>{article.author}</span>
        </div>
        <span>{formatDate(article.publishedAt)}</span>
      </div>
    </Link>
  );
}
