import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const prisma = new PrismaClient();

async function deleteMockArticles() {
  try {
    console.log("🔍 Searching for articles with mock data signatures...");

    // 1. Find articles with mock text in content
    const mockContentArticles = await prisma.article.findMany({
      where: {
        content: {
          contains: "simulated enhancement",
          mode: "insensitive",
        },
      },
    });

    console.log(
      `Found ${mockContentArticles.length} articles with "simulated enhancement" in content.`
    );

    // 2. Find articles with mock enhancement details
    // Note: Filtering JSON in Prisma depends on DB support, doing client-side filtering safely
    const allEnhanced = await prisma.article.findMany({
      where: { isEnhanced: true },
    });

    const mockDetailArticles = allEnhanced.filter((a) => {
      const details = JSON.stringify(a.enhancementDetails || []);
      return (
        details.includes("Sample reason") || details.includes("TEST HIGHLIGHT")
      );
    });

    console.log(
      `Found ${mockDetailArticles.length} articles with mock string in enhancementDetails.`
    );

    // Combine IDs
    const idsToDelete = new Set([
      ...mockContentArticles.map((a) => a.id),
      ...mockDetailArticles.map((a) => a.id),
    ]);

    if (idsToDelete.size === 0) {
      console.log("✅ No mock data articles found. Database is clean.");
      return;
    }

    console.log(`🗑️  Deleting ${idsToDelete.size} mock articles...`);

    const result = await prisma.article.deleteMany({
      where: {
        id: {
          in: Array.from(idsToDelete),
        },
      },
    });

    console.log(`✅ Successfully deleted ${result.count} articles.`);
  } catch (error) {
    console.error("❌ Error deleting mock articles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteMockArticles();
