import axios from "axios";
import * as cheerio from "cheerio";

/** Google search result structure */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Service for searching Google using the Custom Search API.
 *
 * To use this service, you need:
 * 1. Create a Custom Search Engine at https://programmablesearchengine.google.com/
 * 2. Get an API Key from https://console.cloud.google.com/apis/credentials
 * 3. Enable "Custom Search API" in Google Cloud Console
 * 4. Set GOOGLE_API_KEY and GOOGLE_CX in your .env file
 */
export class GoogleSearchService {
  /** Rotate user agents for scraping */
  private userAgents = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Searches Google using the Custom Search API.
   * Falls back to web scraping if API credentials are not configured.
   *
   * @param query - Search query string
   * @param numResults - Number of results to return (default: 3)
   * @returns Array of search results with title, URL, and snippet
   */
  async search(query: string, numResults: number = 3): Promise<SearchResult[]> {
    console.log(`🔍 Searching Google for: "${query.substring(0, 50)}..."`);

    // Read env vars lazily (after dotenv has loaded)
    const apiKey = process.env.GOOGLE_API_KEY || "";
    const cx = process.env.GOOGLE_CX || "";

    // Use Custom Search API if credentials are available
    if (apiKey && cx) {
      return this.searchWithAPI(query, numResults, apiKey, cx);
    }

    // Fallback message
    console.log("⚠️  Google Custom Search API not configured.");
    console.log("   To enable search, add these to your .env:");
    console.log("   GOOGLE_API_KEY=your_api_key");
    console.log("   GOOGLE_CX=your_search_engine_id");
    console.log("");
    console.log("   Get them from:");
    console.log(
      "   1. API Key: https://console.cloud.google.com/apis/credentials"
    );
    console.log("   2. CX: https://programmablesearchengine.google.com/");

    return [];
  }

  /**
   * Searches using Google Custom Search API (reliable, official method).
   */
  private async searchWithAPI(
    query: string,
    numResults: number,
    apiKey: string,
    cx: string
  ): Promise<SearchResult[]> {
    try {
      const searchQuery = encodeURIComponent(query + " blog article");
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${searchQuery}&num=${Math.min(
        numResults,
        10
      )}`;

      const response = await axios.get(url, { timeout: 15000 });
      const items = response.data.items || [];

      const results: SearchResult[] = items
        .filter((item: any) => {
          const link = item.link || "";
          // Filter out social media and source domain
          return (
            !link.includes("youtube.com") &&
            !link.includes("facebook.com") &&
            !link.includes("twitter.com") &&
            !link.includes("linkedin.com") &&
            !link.includes("beyondchats.com")
          );
        })
        .slice(0, numResults)
        .map((item: any) => ({
          title: item.title || "",
          url: item.link || "",
          snippet: item.snippet || "",
        }));

      console.log(
        `   ✅ Found ${results.length} results via Custom Search API`
      );
      return results;
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.error("❌ API quota exceeded or invalid API key");
      } else if (error.response?.status === 400) {
        console.error("❌ Invalid Custom Search Engine ID (CX)");
      } else {
        console.error(`❌ Google API search failed: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Scrapes article content from a URL.
   * Removes nav, ads, and other non-content elements.
   *
   * @param url - URL to scrape
   * @returns Cleaned article text content
   */
  async scrapeArticleContent(url: string): Promise<string> {
    console.log(`📄 Scraping: ${url.substring(0, 60)}...`);

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": this.getRandomUserAgent(),
          Accept: "text/html,application/xhtml+xml",
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      // Remove non-content elements
      $(
        "script, style, nav, header, footer, aside, .sidebar, .comments, .advertisement, .related-posts"
      ).remove();

      // Try common content selectors
      let content = "";
      const contentSelectors = [
        "article",
        '[role="main"]',
        ".post-content",
        ".entry-content",
        ".article-content",
        ".blog-content",
        "main",
        ".content",
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length) {
          content = element.text().trim();
          if (content.length > 500) break;
        }
      }

      // Fallback: get all paragraphs
      if (content.length < 500) {
        content = $("p")
          .map((_, el) => $(el).text().trim())
          .get()
          .join("\n\n");
      }

      // Clean up whitespace
      content = content
        .replace(/\s+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // Limit content length for LLM processing
      const maxLength = 5000;
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + "...";
      }

      console.log(`   ✅ Scraped ${content.length} characters`);
      return content;
    } catch (error: any) {
      console.error(`❌ Failed to scrape ${url}: ${error.message}`);
      return "";
    }
  }
}

/** Singleton instance of GoogleSearchService */
export const googleSearchService = new GoogleSearchService();
