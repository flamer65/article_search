import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const prisma = new PrismaClient();

async function cleanupArticles() {
  try {
    console.log("🔍 Identifying articles to keep...");

    // 1. Find the 5 most recent Enhanced articles
    const enhancedArticles = await prisma.article.findMany({
      where: { isEnhanced: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (enhancedArticles.length === 0) {
      console.log(
        "⚠️ No enhanced articles found. Aborting cleanup to prevent deleting originals by mistake."
      );
      return;
    }

    const enhancedIds = enhancedArticles.map((a) => a.id);
    const originalIds = enhancedArticles
      .map((a) => a.originalArticleId)
      .filter((id): id is string => id !== null);

    const idsToKeep = [...enhancedIds, ...originalIds];

    console.log(
      `✅ Found ${enhancedArticles.length} Enhanced articles to keep.`
    );
    console.log(
      `✅ Found ${originalIds.length} linked Original articles to keep.`
    );
    console.log(`🔒 Total Articles to protect: ${idsToKeep.length}`);

    // 2. Count distinct original articles to ensure we have pairs
    const originalArticles = await prisma.article.findMany({
      where: { id: { in: originalIds } },
    });

    console.log("\n--- Protected Articles ---");
    enhancedArticles.forEach((e) => {
      const orig = originalArticles.find((o) => o.id === e.originalArticleId);
      console.log(`[Enhanced] ${e.title} (ID: ${e.id.substring(0, 8)}...)`);
      if (orig) {
        console.log(
          `   └─ [Original] ${orig.title} (ID: ${orig.id.substring(0, 8)}...)`
        );
      } else {
        console.log(`   └─ ⚠️ Original not found!`);
      }
    });
    console.log("--------------------------\n");

    // 3. Delete everything else
    const deleteResult = await prisma.article.deleteMany({
      where: {
        id: {
          notIn: idsToKeep,
        },
      },
    });

    console.log(`🗑️  Deleted ${deleteResult.count} other articles.`);
    console.log("🎉 Cleanup complete.");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupArticles();
