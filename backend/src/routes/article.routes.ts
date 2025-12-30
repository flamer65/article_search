import { Router } from "express";
import {
  getArticles,
  getArticle,
  getArticleWithEnhanced,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../controllers/article.controller.js";

export const articleRouter = Router();

articleRouter.get("/", getArticles);
articleRouter.get("/:id", getArticle);
articleRouter.get("/:id/enhanced", getArticleWithEnhanced);
articleRouter.post("/", createArticle);
articleRouter.put("/:id", updateArticle);
articleRouter.delete("/:id", deleteArticle);
