import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { articleRouter } from "./routes/article.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { prisma } from "./lib/prisma.js";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

const corsOrigins = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:5173",
];
app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/articles", articleRouter);

app.use(errorHandler);

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📚 API docs: http://localhost:${PORT}/api/articles`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

main();
