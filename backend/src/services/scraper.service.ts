import axios from "axios";
import * as cheerio from "cheerio";

/** Scraped article data structure */
export interface ScrapedArticle {
  title: string;
  content: string;
  excerpt: string;
  author: string;
  publishedAt: Date;
  sourceUrl: string;
  tags: string[];
}

/** Target articles to scrape from BeyondChats blog (5 oldest) */
const TARGET_ARTICLES = [
  {
    url: "https://beyondchats.com/blogs/introduction-to-chatbots/",
    publishedAt: new Date("2023-12-05"),
  },
  {
    url: "https://beyondchats.com/blogs/live-chatbot/",
    publishedAt: new Date("2023-12-06"),
  },
  {
    url: "https://beyondchats.com/blogs/virtual-assistant/",
    publishedAt: new Date("2023-12-07"),
  },
  {
    url: "https://beyondchats.com/blogs/chatbots-for-small-business-growth/",
    publishedAt: new Date("2023-12-08"),
  },
  {
    url: "https://beyondchats.com/blogs/lead-generation-chatbots/",
    publishedAt: new Date("2023-12-08"),
  },
];

/**
 * Service for scraping articles from BeyondChats blog.
 * Uses Axios for HTTP requests and Cheerio for HTML parsing.
 */
export class ScraperService {
  private baseUrl = "https://beyondchats.com";

  /** Helper to add delay between requests (rate limiting) */
  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetches raw HTML content from a URL.
   * @param url - URL to fetch
   * @returns HTML string
   */
  private async fetchHtml(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw new Error(`Failed to fetch ${url}`);
    }
  }

  /**
   * Scrapes a single article page and extracts structured data.
   * @param url - Article URL to scrape
   * @param publishedAt - Known publish date
   * @returns Structured article data
   */
  async scrapeArticle(url: string, publishedAt: Date): Promise<ScrapedArticle> {
    console.log(`📄 Scraping: ${url}`);

    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    // Extract title from h1 or page title
    const title =
      $("h1").first().text().trim() ||
      $("article h1").text().trim() ||
      $("title").text().split("|")[0].trim();

    // Extract author from author link or fallback
    const author =
      $('a[href*="/author/"]').first().text().trim() ||
      $(".author-name").text().trim() ||
      "Unknown Author";

    // Extract content from common article selectors
    let content = "";
    const contentSelectors = [
      "article .entry-content",
      "article .post-content",
      ".blog-content",
      "article .content",
      ".elementor-widget-theme-post-content",
      "article",
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        element
          .find("script, style, nav, .share-buttons, .related-posts")
          .remove();
        content = element.text().trim();
        if (content.length > 200) break;
      }
    }

    // Fallback: concatenate all paragraphs
    if (content.length < 200) {
      content = $("p")
        .map((_, el) => $(el).text().trim())
        .get()
        .join("\n\n");
    }

    const excerpt = content.substring(0, 200).trim() + "...";

    // Extract tags from tag links
    const tags: string[] = [];
    $('a[href*="/tag/"]').each((_, el) => {
      const tag = $(el).text().trim();
      if (tag && !tags.includes(tag) && tag.length < 50) {
        tags.push(tag);
      }
    });

    return {
      title: title || "Untitled",
      content,
      excerpt,
      author,
      publishedAt,
      sourceUrl: url,
      tags: tags.slice(0, 10),
    };
  }

  /**
   * Scrapes all target articles with rate limiting.
   * @returns Array of scraped article data
   */
  async scrapeAllArticles(): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];

    console.log(
      `\n🚀 Starting to scrape ${TARGET_ARTICLES.length} articles...\n`
    );

    for (const target of TARGET_ARTICLES) {
      try {
        const article = await this.scrapeArticle(
          target.url,
          target.publishedAt
        );
        articles.push(article);
        console.log(`✅ Scraped: ${article.title.substring(0, 50)}...`);

        await this.delay(1000); // Rate limiting
      } catch (error) {
        console.error(`❌ Failed to scrape ${target.url}:`, error);
      }
    }

    console.log(`\n✅ Successfully scraped ${articles.length} articles\n`);
    return articles;
  }
}

/** Singleton instance of ScraperService */
export const scraperService = new ScraperService();
