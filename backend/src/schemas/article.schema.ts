import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  author: z.string().min(1, "Author is required"),
  publishedAt: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val)),
  sourceUrl: z.string().url("Invalid URL format"),
  tags: z.array(z.string()).default([]),
  originalArticleId: z.string().uuid().optional(),
  isEnhanced: z.boolean().default(false),
  citedReferences: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url(),
      })
    )
    .optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  isEnhanced: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  search: z.string().optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;
