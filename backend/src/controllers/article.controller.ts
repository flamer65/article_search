import type { Request, Response } from "express";
import { articleService } from "../services/article.service.js";
import {
  createArticleSchema,
  updateArticleSchema,
  listArticlesQuerySchema,
} from "../schemas/article.schema.js";
import { AppError, asyncHandler } from "../middleware/error.middleware.js";

/**
 * GET /api/articles
 * Lists all articles with pagination and optional filtering.
 * Query params: page, limit, isEnhanced, search
 */
export const getArticles = asyncHandler(async (req: Request, res: Response) => {
  const queryResult = listArticlesQuerySchema.safeParse(req.query);

  if (!queryResult.success) {
    throw new AppError(400, queryResult.error.errors[0].message);
  }

  const result = await articleService.findAll(queryResult.data);

  res.json({
    success: true,
    data: result.articles,
    pagination: result.pagination,
  });
});

/**
 * GET /api/articles/:id
 * Retrieves a single article by ID.
 */
export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const article = await articleService.findById(id);

  res.json({
    success: true,
    data: article,
  });
});

/**
 * GET /api/articles/:id/enhanced
 * Retrieves an article with all its enhanced versions.
 * Used for comparison view between original and enhanced.
 */
export const getArticleWithEnhanced = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const article = await articleService.getWithEnhanced(id);

    res.json({
      success: true,
      data: article,
    });
  }
);

/**
 * POST /api/articles
 * Creates a new article.
 * Request body is validated against createArticleSchema.
 */
export const createArticle = asyncHandler(
  async (req: Request, res: Response) => {
    const bodyResult = createArticleSchema.safeParse(req.body);

    if (!bodyResult.success) {
      throw new AppError(
        400,
        bodyResult.error.errors.map((e) => e.message).join(", ")
      );
    }

    const article = await articleService.create(bodyResult.data);

    res.status(201).json({
      success: true,
      message: "Article created successfully",
      data: article,
    });
  }
);

/**
 * PUT /api/articles/:id
 * Updates an existing article.
 * Request body is validated against updateArticleSchema (all fields optional).
 */
export const updateArticle = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const bodyResult = updateArticleSchema.safeParse(req.body);

    if (!bodyResult.success) {
      throw new AppError(
        400,
        bodyResult.error.errors.map((e) => e.message).join(", ")
      );
    }

    const article = await articleService.update(id, bodyResult.data);

    res.json({
      success: true,
      message: "Article updated successfully",
      data: article,
    });
  }
);

/**
 * DELETE /api/articles/:id
 * Deletes an article by ID.
 */
export const deleteArticle = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    await articleService.delete(id);

    res.json({
      success: true,
      message: "Article deleted successfully",
    });
  }
);
