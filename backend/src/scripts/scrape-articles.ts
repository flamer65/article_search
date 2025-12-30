import { prisma } from "../lib/prisma.js";
import {
  scraperService,
  type ScrapedArticle,
} from "../services/scraper.service.js";

async function seedArticles() {
  console.log("🌱 Starting article seeding process...\n");

  try {
    const scrapedArticles = await scraperService.scrapeAllArticles();

    if (scrapedArticles.length === 0) {
      console.log("⚠️ No articles were scraped. Exiting.");
      return;
    }

    console.log("💾 Storing articles in database...\n");

    let created = 0;
    let skipped = 0;

    for (const article of scrapedArticles) {
      try {
        const existing = await prisma.article.findUnique({
          where: { sourceUrl: article.sourceUrl },
        });

        if (existing) {
          console.log(
            `⏭️ Skipped (already exists): ${article.title.substring(0, 40)}...`
          );
          skipped++;
          continue;
        }

        await prisma.article.create({
          data: {
            title: article.title,
            content: article.content,
            excerpt: article.excerpt,
            author: article.author,
            publishedAt: article.publishedAt,
            sourceUrl: article.sourceUrl,
            tags: article.tags,
            isEnhanced: false,
          },
        });

        console.log(`✅ Created: ${article.title.substring(0, 40)}...`);
        created++;
      } catch (error) {
        console.error(`❌ Failed to store article: ${article.title}`, error);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Seeding Summary:");
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped} (already existed)`);
    console.log("=".repeat(50) + "\n");

    const allArticles = await prisma.article.findMany({
      where: { isEnhanced: false },
      select: { id: true, title: true, publishedAt: true },
    });

    console.log("📚 Articles in database:");
    allArticles.forEach((a, i) => {
      console.log(
        `   ${i + 1}. ${a.title.substring(
          0,
          50
        )}... (${a.publishedAt.toDateString()})`
      );
    });
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedArticles()
  .then(() => {
    console.log("\n✅ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
