import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";

/** Structure for enhanced article content */
export interface EnhancedContent {
  title: string;
  content: string;
  excerpt: string;
  enhancementDetails?: Array<{
    type: "addition" | "modification";
    originalText?: string;
    newText: string;
    reason: string;
  }>;
}

/**
 * Service for enhancing articles using Google Gemini AI.
 * Takes original content and competitor articles as context.
 */
export class LLMService {
  private model: GenerativeModel | null = null;
  private isInitialized = false;

  /**
   * Initializes the Gemini client with an API key.
   * @param apiKey - Google Gemini API key
   */
  initialize(apiKey: string) {
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.warn("⚠️ Gemini API key not configured. LLM features disabled.");
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 8192, // Increased for larger detailed response
        },
      });
      this.isInitialized = true;
      console.log("✅ Gemini AI initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Gemini:", error);
    }
  }

  /**
   * Enhances an article using competitor content as reference.
   * Uses Gemini to generate improved, more comprehensive content.
   *
   * @param originalArticle - The article to enhance
   * @param competitorContent - Array of competitor articles for reference
   * @returns Enhanced content or null if LLM is unavailable
   */
  async enhanceArticle(
    originalArticle: {
      title: string;
      content: string;
    },
    competitorContent: Array<{
      title: string;
      content: string;
      url: string;
    }>
  ): Promise<EnhancedContent | null> {
    if (!this.isInitialized || !this.model) {
      console.warn("⚠️ LLM not initialized. Returning original content.");
      return null;
    }

    console.log(`🤖 Enhancing article with Gemini...`);

    const prompt = this.buildEnhancementPrompt(
      originalArticle,
      competitorContent
    );

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const enhanced = this.parseEnhancedContent(text, originalArticle);

      console.log(`✅ Article enhanced successfully`);
      return enhanced;
    } catch (error: any) {
      console.error(`❌ LLM enhancement failed: ${error.message}`);
      // return null;
      throw error;
    }
  }

  /**
   * Builds the prompt for article enhancement.
   * Includes original article and competitor content as context.
   */
  private buildEnhancementPrompt(
    original: { title: string; content: string },
    competitors: Array<{ title: string; content: string; url: string }>
  ): string {
    const competitorTexts = competitors
      .map(
        (c, i) => `
### Reference Article ${i + 1}: "${c.title}"
URL: ${c.url}

${c.content.substring(0, 2000)}
`
      )
      .join("\n---\n");

    return `
You are an expert content writer and SEO specialist. Your task is to enhance an existing article to make it more comprehensive, engaging, and competitive with top-ranking articles on the same topic.

## Instructions:
1. Analyze the original article and the reference articles from competitors
2. Improve the original article by:
   - Making the content more comprehensive and detailed
   - Improving the structure and readability
   - Adding relevant information from competitors (without copying)
   - Making the tone more engaging
   - Ensuring good SEO practices (headings, keywords)
3. Keep the original author's voice and perspective
4. Do NOT copy content directly from competitors
5. The enhanced article should be clearly better than the original

## CRITICAL REQUIREMENT:
You must provide a detailed breakdown of the enhancements you made. Identify specific blocks of text you added or modified and explain WHY you made those changes (e.g., "Added latest statistics," "Clarified technical term," "Included missing step").

## Original Article:
Title: ${original.title}

${original.content}

## Reference Articles (Top Ranking Competitors):
${competitorTexts}

## Output Format:
Respond with a JSON object containing:
{
  "title": "Enhanced title (keep similar to original or improve)",
  "content": "The full enhanced article content in HTML format with proper headings (h2, h3), paragraphs, and lists",
  "excerpt": "A compelling 2-3 sentence summary of the article",
  "enhancementDetails": [
    {
      "type": "addition" | "modification",
      "newText": "The actual text you added or the specific paragraph you modified (HTML fragment)",
      "reason": "Clear explanation of why this was added/changed"
    },
    ...
  ]
}

Important: 
- Return ONLY the JSON object, no additional text or markdown code blocks.
- Ensure 'enhancementDetails' contains at least 3-5 key significant changes.
- The 'newText' in details should match sections in the full 'content'.
`;
  }

  /**
   * Parses LLM response into structured enhanced content.
   * Handles JSON parsing and provides fallback for malformed responses.
   */
  private parseEnhancedContent(
    response: string,
    original: { title: string; content: string }
  ): EnhancedContent {
    try {
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr
          .replace(/^```(json)?\n?/, "")
          .replace(/```$/, "")
          .trim();
      }

      const parsed = JSON.parse(jsonStr);

      return {
        title: parsed.title || original.title,
        content: parsed.content || original.content,
        excerpt: parsed.excerpt || original.content.substring(0, 200),
        enhancementDetails: parsed.enhancementDetails || [],
      };
    } catch (error) {
      console.warn(
        "⚠️ Failed to parse LLM response as JSON, using text directly"
      );

      // Fallback: use response as content
      return {
        title: original.title + " (Enhanced)",
        content: response,
        excerpt: response.substring(0, 200),
        enhancementDetails: [],
      };
    }
  }
}

/** Singleton instance of LLMService */
export const llmService = new LLMService();
