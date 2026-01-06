import type { CachedContent } from "@google/generative-ai/server";
import type { IGeminiService } from "../../src/ai/IGeminiService.js";

export class MockGeminiService implements IGeminiService {
  async createCache(content: string, mimeType: string, ttlSeconds = 600): Promise<CachedContent> {
    console.log("[MockGeminiService] Creating cache");
    // Return a dummy cache object that satisfies the CachedContent interface (partially or as needed)
    return {
      name: "mock-cache-name",
      displayName: "mock-cache-display-name",
      model: "models/gemini-1.5-flash",
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      expireTime: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    } as CachedContent;
  }

  async generateContent(prompt: string, cachedContent?: CachedContent): Promise<string> {
    console.log("[MockGeminiService] Generating content for prompt length:", prompt.length);
    if (cachedContent) {
        console.log("[MockGeminiService] Using cached content:", cachedContent.name);
    }
    
    return `# Mock Documentation

This is a mocked response from Gemini.

## Prompt Received
${prompt}

## Analysis
The code analyzed suggests this is a simple test repository.

## Summary
A simple repository with a README and a main.ts file.
`;
  }
}
