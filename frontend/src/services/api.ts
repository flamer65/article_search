import axios, { type AxiosInstance } from "axios";

/** Article data structure from the API */
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
  citedReferences?: Array<{ title: string; url: string; snippet?: string }>;
  enhancementDetails?: Array<{
    type: "addition" | "modification";
    originalText?: string;
    newText: string;
    reason: string;
  }>;
  original?: Article | null;
  enhancedVersions?: Article[];
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
}

/**
 * Frontend API client for fetching articles.
 * Communicates with the Express backend API.
 */
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VERCEL_PUBLIC_API_URL || "http://localhost:3000/api",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Fetches articles with optional filtering.
   * @param filter - 'all', 'original', or 'enhanced'
   * @returns Array of articles
   */
  async getArticles(
    filter?: "all" | "original" | "enhanced"
  ): Promise<Article[]> {
    const params: Record<string, string> = { limit: "100" };

    if (filter === "original") {
      params.isEnhanced = "false";
    } else if (filter === "enhanced") {
      params.isEnhanced = "true";
    }

    const response = await this.client.get<ArticleListResponse>("/articles", {
      params,
    });
    return response.data.data;
  }

  /**
   * Fetches a single article by ID.
   * @param id - Article UUID
   * @returns Article data
   */
  async getArticle(id: string): Promise<Article> {
    const response = await this.client.get<ArticleResponse>(`/articles/${id}`);
    return response.data.data;
  }

  /**
   * Fetches an article with its enhanced versions.
   * Used for comparison view and navigation between versions.
   * @param id - Article UUID
   * @returns Article with enhancedVersions populated
   */
  async getArticleWithEnhanced(id: string): Promise<Article> {
    const response = await this.client.get<ArticleResponse>(
      `/articles/${id}/enhanced`
    );
    return response.data.data;
  }
}

/** Singleton API service instance */
export const apiService = new ApiService();
