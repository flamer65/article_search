/**
 * Article Detail Page
 * Displays full article content with:
 * - Original/Enhanced badges
 * - Navigation between versions
 * - Cited references for enhanced articles
 * - Side-by-side comparison view
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService, type Article } from "../services/api";

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [originalArticle, setOriginalArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getArticleWithEnhanced(id);
        setArticle(data);

        // If this is an enhanced article, also fetch the original for comparison
        if (data.isEnhanced) {
          setShowComparison(true); // Auto-show comparison for enhanced articles
          if (data.originalArticleId) {
            try {
              const original = await apiService.getArticle(
                data.originalArticleId
              );
              setOriginalArticle(original);
            } catch {
              // Original might not be available
            }
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch article";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h3>Article Not Found</h3>
            <p>{error || "The requested article could not be found."}</p>
            <Link to="/" className="btn btn-primary mt-4">
              ← Back to Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="article-detail">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-8 text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Articles
          </Link>

          {/* Article Header */}
          <div className="article-header">
            <span
              className={`article-badge text-base px-4 py-2 ${
                article.isEnhanced ? "badge-enhanced" : "badge-original"
              }`}
            >
              {article.isEnhanced
                ? "✨ ENHANCED VERSION"
                : "📄 ORIGINAL ARTICLE"}
            </span>
            <h1>{article.title}</h1>
            <div className="mt-4 text-neutral-400">
              By <strong className="text-white">{article.author}</strong> •{" "}
              {formatDate(article.publishedAt)}
            </div>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="article-tags justify-center mb-8">
              {article.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Version Navigation Banner - Enhanced Article */}
          {article.isEnhanced && article.original && (
            <div className="version-banner enhanced">
              <div className="version-info">
                <h4 className="text-green-400">
                  ✨ This is an AI-Enhanced Version
                </h4>
                <p>
                  Enhanced from:{" "}
                  <strong className="text-white">
                    {article.original.title}
                  </strong>
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link
                  to={`/article/${article.original.id}`}
                  className="btn btn-secondary"
                >
                  📄 View Original
                </Link>
                {originalArticle && (
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="btn btn-primary"
                  >
                    {showComparison ? "Hide Comparison" : "⚖️ Compare Versions"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Version Navigation Banner - Original Article */}
          {!article.isEnhanced &&
            article.enhancedVersions &&
            article.enhancedVersions.length > 0 && (
              <div className="version-banner original">
                <div className="version-info">
                  <h4 className="text-accent">
                    📄 This is the Original Article
                  </h4>
                  <p>An AI-enhanced version is available</p>
                </div>
                <Link
                  to={`/article/${article.enhancedVersions[0].id}`}
                  className="btn btn-primary"
                >
                  ✨ View Enhanced Version
                </Link>
              </div>
            )}

          {/* Smart Diff / Detailed Comparison View */}
          {showComparison && (
            <div className="space-y-8 mb-12">
              <div className="bg-dark-700 rounded-2xl p-6 border border-neutral-600/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl text-white m-0">
                    🔍 Detailed Enhancement Analysis
                  </h3>
                  <div className="text-sm text-neutral-400">
                    Showing{" "}
                    <span className="text-green-400 font-bold">Additions</span>{" "}
                    and{" "}
                    <span className="text-blue-400 font-bold">Reasoning</span>
                  </div>
                </div>

                {article.enhancementDetails &&
                article.enhancementDetails.length > 0 ? (
                  <div className="space-y-6">
                    {article.enhancementDetails.map(
                      (detail: any, index: number) => (
                        <div
                          key={index}
                          className="bg-dark-800 rounded-xl p-5 border border-neutral-600/30 relative overflow-hidden group"
                        >
                          <div
                            className={`absolute top-0 left-0 bottom-0 w-1 ${
                              detail.type === "addition"
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                          ></div>

                          <div className="flex flex-col md:flex-row gap-6">
                            {/* The Content */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <span
                                  className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                                    detail.type === "addition"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-blue-500/20 text-blue-400"
                                  }`}
                                >
                                  {detail.type}
                                </span>
                              </div>

                              {detail.originalText && (
                                <div className="mb-4 p-3 bg-red-900/10 border-l-2 border-red-500/30 rounded text-neutral-400 text-sm">
                                  <div className="text-xs text-red-400/70 mb-1 uppercase font-semibold">
                                    Original:
                                  </div>
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: detail.originalText,
                                    }}
                                  />
                                </div>
                              )}

                              <div className="prose prose-invert max-w-none">
                                <div
                                  className="text-neutral-200 p-4 rounded-lg border-l-4"
                                  style={{
                                    backgroundColor:
                                      detail.type === "addition"
                                        ? "rgba(34, 197, 94, 0.3)"
                                        : "rgba(59, 130, 246, 0.3)",
                                    borderColor:
                                      detail.type === "addition"
                                        ? "#22c55e"
                                        : "#3b82f6",
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: detail.newText,
                                  }}
                                />
                              </div>
                            </div>

                            {/* The Reasoning */}
                            <div className="md:w-1/3 min-w-[250px] bg-dark-600/50 p-4 rounded-lg border border-white/5 h-fit">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-lg">💡</span>
                                <span className="font-semibold text-neutral-300 text-sm">
                                  Why this was changed:
                                </span>
                              </div>
                              <p className="text-sm text-neutral-400 italic leading-relaxed">
                                "{detail.reason}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  // Fallback for older articles without detailed data
                  <div className="comparison-container">
                    <div className="comparison-panel">
                      <h3 className="text-accent">📄 Original Content</h3>
                      <div
                        className="text-sm text-neutral-400 max-h-96 overflow-auto p-4 bg-dark-600 rounded-lg custom-scrollbar"
                        dangerouslySetInnerHTML={{
                          __html:
                            originalArticle?.content ||
                            "Original content not available.",
                        }}
                      />
                    </div>
                    <div className="comparison-panel">
                      <h3 className="text-green-400">✨ Enhanced Content</h3>
                      <div
                        className="text-sm text-neutral-400 max-h-96 overflow-auto p-4 bg-dark-600 rounded-lg custom-scrollbar"
                        dangerouslySetInnerHTML={{
                          __html: article.content,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Citations Section */}
          {article.isEnhanced &&
            article.citedReferences &&
            article.citedReferences.length > 0 && (
              <div className="citations-section">
                <div className="citations-header">
                  <span className="icon">📚</span>
                  <h3>Sources & Citations</h3>
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                  This enhanced article was created using insights from:
                </p>
                <div>
                  {article.citedReferences.map((ref, index) => (
                    <div key={index} className="citation-card">
                      <div className="citation-icon">🔗</div>
                      <div className="citation-content">
                        <div className="citation-title">{ref.title}</div>
                        <div className="citation-url">
                          {(() => {
                            try {
                              return new URL(ref.url).hostname;
                            } catch {
                              return ref.url;
                            }
                          })()}
                        </div>
                      </div>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="citation-link"
                      >
                        View Source ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* No Citations Notice */}
          {article.isEnhanced &&
            (!article.citedReferences ||
              article.citedReferences.length === 0) && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl mb-8 text-sm text-neutral-300">
                ℹ️ This enhanced version was created without external source
                citations.
              </div>
            )}

          {/* Article Content */}
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Source Link */}
          <div className="mt-8 text-center">
            <a
              href={article.sourceUrl.split("#")[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              View Original Source ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
