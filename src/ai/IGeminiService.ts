import type { CachedContent } from "@google/generative-ai/server";

export interface IGeminiService {
  createCache(content: string, mimeType: string, ttlSeconds?: number): Promise<CachedContent>;
  generateContent(prompt: string, cachedContent?: CachedContent): Promise<string>;
}
