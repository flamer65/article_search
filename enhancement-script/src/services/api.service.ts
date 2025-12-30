import axios, { type AxiosInstance } from "axios";

/** Article data structure from the backend API */
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  author: string;
  publishedAt: string;
  sourceUrl: string;
  tags: string[];
  originalArticleId: string | null;
  isEnhanced: boolean;
  citedReferences: Array<{ title: string; url: string }> | null;
  createdAt: string;
  updatedAt: string;
}

/** Paginated article list response */
export interface ArticleListResponse {
  success: boolean;
  data: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Single article response */
export interface ArticleResponse {
  success: boolean;
  data: Article;
  message?: string;
}

/**
 * HTTP client for communicating with the backend API.
 * Provides methods for fetching and creating articles.
 */
export class ApiService {
  private client: AxiosInstance;

  constructor(baseUrl: string = "http://localhost:3000/api") {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Fetches all original (non-enhanced) articles.
   * @returns Array of original articles
   */
  async getOriginalArticles(): Promise<Article[]> {
    try {
      const response = await this.client.get<ArticleListResponse>("/articles", {
        params: {
          isEnhanced: "false",
          limit: 100,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      throw error;
    }
  }

  /**
   * Creates a new enhanced article linked to an original.
   * @param article - Enhanced article data with originalArticleId
   * @returns Created article
   */
  async createEnhancedArticle(article: {
    title: string;
    content: string;
    excerpt: string;
    author: string;
    publishedAt: Date;
    sourceUrl: string;
    tags: string[];
    originalArticleId: string;
    isEnhanced: boolean;
    citedReferences: Array<{ title: string; url: string }>;
    enhancementDetails?: Array<{
      type: "addition" | "modification";
      originalText?: string;
      newText: string;
      reason: string;
    }>;
  }): Promise<Article> {
    try {
      const response = await this.client.post<ArticleResponse>("/articles", {
        ...article,
        publishedAt: article.publishedAt.toISOString(),
      });
      return response.data.data;
    } catch (error) {
      console.error("Failed to create enhanced article:", error);
      throw error;
    }
  }

  /**
   * Checks if the backend API is reachable.
   * @returns true if API responds, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/articles", { params: { limit: 1 } });
      return true;
    } catch {
      return false;
    }
  }
}

/** Singleton instance with URL from environment */
export const apiService = new ApiService(
  process.env.API_URL || "http://localhost:3000/api"
);
