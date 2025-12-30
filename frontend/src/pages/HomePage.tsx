/**
 * Home Page - Article Listing
 * Displays all articles with filter tabs
 */

import { useState, useEffect } from "react";
import { apiService, type Article } from "../services/api";
import { ArticleCard } from "../components/ArticleCard";

type FilterType = "all" | "original" | "enhanced";

export function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  // Fetch articles when component mounts or filter changes
  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getArticles(filter);
        setArticles(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch articles";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [filter]);

  // Count articles by type
  const originalCount = articles.filter((a) => !a.isEnhanced).length;
  const enhancedCount = articles.filter((a) => a.isEnhanced).length;

  return (
    <div className="page">
      <div className="container">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1>Article Search System</h1>
          <p className="text-neutral-400 mt-4 text-lg">
            Explore original and AI-enhanced articles from BeyondChats
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Articles ({articles.length})
          </button>
          <button
            className={`filter-tab ${filter === "original" ? "active" : ""}`}
            onClick={() => setFilter("original")}
          >
            📄 Original ({originalCount})
          </button>
          <button
            className={`filter-tab ${filter === "enhanced" ? "active" : ""}`}
            onClick={() => setFilter("enhanced")}
          >
            ✨ Enhanced ({enhancedCount})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading articles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h3>Failed to Load Articles</h3>
            <p>{error}</p>
            <p className="mt-4 text-sm">
              Make sure the backend is running at{" "}
              <code className="bg-dark-600 px-2 py-1 rounded">
                http://localhost:3000
              </code>
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && articles.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3>No Articles Found</h3>
            <p>Run the scraper script to fetch articles from BeyondChats.</p>
            <code className="block mt-4 p-4 bg-dark-600 rounded-lg">
              cd backend && npm run scrape
            </code>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && articles.length > 0 && (
          <div className="articles-grid">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
