import { prisma } from "../lib/prisma.js";
import type {
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesQuery,
} from "../schemas/article.schema.js";
import { AppError } from "../middleware/error.middleware.js";

/**
 * Service layer for article CRUD operations.
 * Contains all business logic, separate from HTTP handling.
 */
export class ArticleService {
  /**
   * Creates a new article.
   * @throws AppError 409 if article with same sourceUrl already exists
   */
  async create(data: CreateArticleInput) {
    const existing = await prisma.article.findUnique({
      where: { sourceUrl: data.sourceUrl },
    });

    if (existing) {
      throw new AppError(409, "Article with this URL already exists");
    }

    return prisma.article.create({
      data: {
        ...data,
        citedReferences: data.citedReferences || undefined,
      },
    });
  }

  /**
   * Retrieves articles with pagination, filtering, and search.
   * @param query - Pagination and filter options
   * @returns Articles array and pagination metadata
   */
  async findAll(query: ListArticlesQuery) {
    const { page, limit, isEnhanced, search } = query;
    const skip = (page - 1) * limit;

    // Build dynamic where clause
    const where: any = {};

    if (isEnhanced !== undefined) {
      where.isEnhanced = isEnhanced;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    // Run count and find in parallel for better performance
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          original: {
            select: { id: true, title: true },
          },
          enhancedVersions: {
            select: { id: true },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Finds a single article by ID.
   * @throws AppError 404 if article not found
   */
  async findById(id: string) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        original: true,
        enhancedVersions: true,
      },
    });

    if (!article) {
      throw new AppError(404, "Article not found");
    }

    return article;
  }

  /**
   * Updates an existing article.
   * @throws AppError 404 if article not found
   * @throws AppError 409 if new sourceUrl conflicts with another article
   */
  async update(id: string, data: UpdateArticleInput) {
    await this.findById(id);

    // Check for URL conflict if updating sourceUrl
    if (data.sourceUrl) {
      const existing = await prisma.article.findFirst({
        where: {
          sourceUrl: data.sourceUrl,
          NOT: { id },
        },
      });

      if (existing) {
        throw new AppError(409, "Another article with this URL already exists");
      }
    }

    return prisma.article.update({
      where: { id },
      data: {
        ...data,
        citedReferences: data.citedReferences || undefined,
      },
    });
  }

  /**
   * Deletes an article by ID.
   * @throws AppError 404 if article not found
   */
  async delete(id: string) {
    await this.findById(id);

    return prisma.article.delete({
      where: { id },
    });
  }

  /**
   * Gets an article with all its enhanced versions.
   * Used for original vs enhanced comparison view.
   * @throws AppError 404 if article not found
   */
  async getWithEnhanced(id: string) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        enhancedVersions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!article) {
      throw new AppError(404, "Article not found");
    }

    return article;
  }
}

/** Singleton instance of ArticleService */
export const articleService = new ArticleService();
