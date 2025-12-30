// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import { apiService, type Article } from "./services/api.service.js";
import {
  googleSearchService,
  type SearchResult,
} from "./services/google.service.js";
import { llmService } from "./services/llm.service.js";

/** Configuration for the enhancement process */
const CONFIG = {
  enableGoogleSearch: process.env.ENABLE_GOOGLE_SEARCH !== "false",
  enableLLM: process.env.ENABLE_LLM_ENHANCEMENT !== "false",
  delayBetweenArticles: 3000, // ms between processing articles
  delayBetweenSearches: 2000, // ms between Google searches
};

/**
 * Enhances a single article by:
 * 1. Searching Google for related competitor articles
 * 2. Scraping competitor content
 * 3. Using LLM to generate improved content
 * 4. Publishing the enhanced version to the API
 *
 * @param article - The original article to enhance
 * @returns true if enhancement succeeded, false otherwise
 */
async function enhanceArticle(article: Article): Promise<boolean> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📝 Processing: ${article.title.substring(0, 50)}...`);
  console.log(`${"=".repeat(60)}\n`);

  try {
    // Step 1: Search Google for related articles
    let searchResults: SearchResult[] = [];

    if (CONFIG.enableGoogleSearch) {
      searchResults = await googleSearchService.search(article.title, 2);
      await delay(CONFIG.delayBetweenSearches);
    }

    if (searchResults.length === 0) {
      console.log("⚠️ No Google results found. Using original content only.");
    }

    // Step 2: Scrape content from search results
    const competitorContent: Array<{
      title: string;
      content: string;
      url: string;
    }> = [];

    for (const result of searchResults) {
      const content = await googleSearchService.scrapeArticleContent(
        result.url
      );
      if (content.length > 200) {
        competitorContent.push({
          title: result.title,
          content,
          url: result.url,
        });
      }
      await delay(1000); // Rate limiting
    }

    console.log(`\n📚 Scraped ${competitorContent.length} competitor articles`);

    // Step 3: Enhance with LLM
    let enhancedContent = {
      title: article.title + " (Enhanced)",
      content: article.content,
      excerpt: article.excerpt || article.content.substring(0, 200),
    };

    if (CONFIG.enableLLM && competitorContent.length > 0) {
      const llmResult = await llmService.enhanceArticle(
        { title: article.title, content: article.content },
        competitorContent
      );

      if (llmResult) {
        enhancedContent = llmResult;
      }
    }

    // Step 4: Build citations from competitor sources
    const citations = competitorContent.map((c) => ({
      title: c.title,
      url: c.url,
    }));

    // Append citations HTML to content
    if (citations.length > 0) {
      const citationsHtml = `
<hr/>
<h2>References</h2>
<p>This article was enhanced using insights from the following sources:</p>
<ul>
${citations
  .map(
    (c) =>
      `  <li><a href="${c.url}" target="_blank" rel="noopener">${c.title}</a></li>`
  )
  .join("\n")}
</ul>
`;
      enhancedContent.content += citationsHtml;
    }

    // Step 5: Publish enhanced article to backend API
    await apiService.createEnhancedArticle({
      title: enhancedContent.title,
      content: enhancedContent.content,
      excerpt: enhancedContent.excerpt,
      author: article.author,
      publishedAt: new Date(),
      sourceUrl: `${article.sourceUrl}#enhanced-${Date.now()}`,
      tags: [...article.tags, "enhanced"],
      originalArticleId: article.id,
      isEnhanced: true,
      citedReferences: citations,
      enhancementDetails: (enhancedContent as any).enhancementDetails,
    });

    console.log(`\n✅ Enhanced article published successfully!`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to enhance article: ${error.message}`);
    return false;
  }
}

/** Helper function to create a delay (for rate limiting) */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main entry point for the enhancement script.
 * Fetches all original articles and enhances them one by one.
 */
async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              ARTICLE ENHANCEMENT SCRIPT                    ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  // Initialize Gemini LLM with API key
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
    llmService.initialize(geminiKey);
  } else {
    console.log("⚠️ GEMINI_API_KEY not set. LLM enhancement will be skipped.");
    console.log(
      "   Get a free API key at: https://makersuite.google.com/app/apikey\n"
    );
  }

  // Verify backend API is running
  console.log("🔗 Checking backend API connection...");
  const isApiUp = await apiService.healthCheck();

  if (!isApiUp) {
    console.error(
      "❌ Backend API is not reachable at:",
      process.env.API_URL || "http://localhost:3000/api"
    );
    console.log("\n💡 Make sure to start the backend first:");
    console.log("   cd ../backend && npm run dev\n");
    process.exit(1);
  }

  console.log("✅ Backend API is up and running\n");

  // Fetch all original (non-enhanced) articles
  console.log("📥 Fetching original articles...");
  const articles = await apiService.getOriginalArticles();

  if (articles.length === 0) {
    console.log("⚠️ No original articles found. Please run the scraper first:");
    console.log("   cd ../backend && npm run scrape\n");
    process.exit(0);
  }

  console.log(`📚 Found ${articles.length} original articles to enhance\n`);

  // Process each article sequentially
  let successCount = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] Processing...`);

    const success = await enhanceArticle(article);
    if (success) successCount++;

    // Add delay between articles to avoid rate limiting
    if (i < articles.length - 1) {
      console.log(
        `\n⏳ Waiting ${
          CONFIG.delayBetweenArticles / 1000
        }s before next article...`
      );
      await delay(CONFIG.delayBetweenArticles);
    }
  }

  // Print summary
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log(
    "║                    ENHANCEMENT COMPLETE                     ║"
  );
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(
    `║  Articles processed: ${articles.length
      .toString()
      .padStart(3)}                                  ║`
  );
  console.log(
    `║  Successfully enhanced: ${successCount
      .toString()
      .padStart(3)}                               ║`
  );
  console.log(
    `║  Failed: ${(articles.length - successCount)
      .toString()
      .padStart(3)}                                          ║`
  );
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );
}

// Run the script
main()
  .then(() => {
    console.log("✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
