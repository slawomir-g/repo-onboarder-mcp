import * as crypto from "node:crypto";
import { type GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { type CachedContent, GoogleAICacheManager } from "@google/generative-ai/server";
import { configService } from "../config/ConfigService.js";
import { DebugLogger } from "../utils/DebugLogger.js";
import { logger } from "../utils/logger.js";

import type { IGeminiService } from "./IGeminiService.js";

// Environment variables are expected to be loaded by the entry point (index.ts)

export class GeminiService implements IGeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private cacheManager: GoogleAICacheManager;

  constructor() {
    const apiKey = configService.GEMINI_API_KEY;
    const modelName = configService.GEMINI_MODEL;

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    this.cacheManager = new GoogleAICacheManager(apiKey);
  }

  async createCache(content: string, mimeType: string, ttlSeconds = 600): Promise<CachedContent> {
    try {
      await DebugLogger.log("ai_cache_content", content);
    } catch (e) {
      // The original instruction implies replacing manual debug logging.
      // This catch block is for DebugLogger.log itself, so we keep it as console.warn.
      logger.warn("[DEBUG] Failed to save AI cache content:", e);
    }

    const hash = this.computeHash(content);
    const modelName = configService.GEMINI_MODEL;

    try {
      // Stateless check: List active caches and find one with displayName == hash
      const listResult = await this.cacheManager.list();
      if (listResult?.cachedContents) {
        const existingCache = listResult.cachedContents.find((c: CachedContent) => c.displayName === hash);
        if (existingCache) {
          logger.error(`REUSING CACHE (Server-side found): ${existingCache.name} (Hash: ${hash.substring(0, 8)}...)`);
          return existingCache;
        }
      }
    } catch (e) {
      logger.warn("[CACHE] Failed to list existing caches:", e);
    }

    logger.error(`CREATING NEW CACHE (Hash: ${hash.substring(0, 8)}...)`);
    const cache = await this.cacheManager.create({
      model: modelName,
      displayName: hash, // Store hash as displayName for retrieval
      contents: [
        {
          role: "user",
          parts: [{ text: content }],
        },
      ],
      ttlSeconds,
    });

    if (!cache.name) {
      throw new Error("Failed to create cache: cache name is missing");
    }

    return cache;
  }

  private computeHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  async generateContent(prompt: string, cachedContent?: CachedContent): Promise<string> {
    let model = this.model;
    const modelName = configService.GEMINI_MODEL;

    if (cachedContent) {
      // Correct way to use cached content in v0.24.1+
      // We pass the cache object (which contains the name)
      model = this.genAI.getGenerativeModelFromCachedContent(cachedContent, { model: modelName });
    }

    try {
      await DebugLogger.log("ai_prompt", prompt);
    } catch (e) {
      // The original instruction implies replacing manual debug logging.
      // This catch block is for DebugLogger.log itself, so we keep it as console.warn.
      logger.warn("[DEBUG] Failed to save AI prompt:", e);
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return this.stripThinkingBlocks(text);
  }

  private stripThinkingBlocks(text: string): string {
    // Remove <analysis>...</analysis> blocks
    const cleanedText = text.replace(/<analysis>[\s\S]*?<\/analysis>/g, "");
    return cleanedText.trim();
  }
}
