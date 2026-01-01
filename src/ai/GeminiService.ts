import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

// Environment variables are expected to be loaded by the entry point (index.ts)

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private cacheManager: GoogleAICacheManager;
    private readonly MODEL_NAME = 'gemini-3-flash-preview';

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME }); 
        this.cacheManager = new GoogleAICacheManager(apiKey);
    }

    async createCache(content: string, mimeType: string, ttlSeconds: number = 600): Promise<any> {
        try {
            const debugDir = path.join(process.cwd(), 'debug');
            if (!fs.existsSync(debugDir)) {
                await fs.promises.mkdir(debugDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const debugFile = path.join(debugDir, `ai_cache_content_${timestamp}.txt`);
            await fs.promises.writeFile(debugFile, content);
        } catch (e) {
            console.warn('[DEBUG] Failed to save AI cache content:', e);
        }

        const hash = this.computeHash(content);
        
        try {
            // Stateless check: List active caches and find one with displayName == hash
            const listResult = await this.cacheManager.list();
            if (listResult && listResult.cachedContents) {
                const existingCache = listResult.cachedContents.find((c: any) => c.displayName === hash);
                if (existingCache) {
                    console.error(`REUSING CACHE (Server-side found): ${existingCache.name} (Hash: ${hash.substring(0, 8)}...)`);
                    return existingCache;
                }
            }
        } catch (e) {
            console.warn('[CACHE] Failed to list existing caches:', e);
        }

        console.error(`CREATING NEW CACHE (Hash: ${hash.substring(0, 8)}...)`);
        const cache = await this.cacheManager.create({
            model: this.MODEL_NAME,
            displayName: hash, // Store hash as displayName for retrieval
            contents: [
                {
                    role: 'user',
                    parts: [{ text: content }],
                },
            ],
            ttlSeconds,
        });

        if (!cache.name) {
            throw new Error('Failed to create cache: cache name is missing');
        }

        return cache;
    }

    private computeHash(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    async generateContent(prompt: string, cachedContent?: any): Promise<string> {
        let model = this.model;
        
        if (cachedContent) {
            // Correct way to use cached content in v0.24.1+
            // We pass the cache object (which contains the name)
            model = this.genAI.getGenerativeModelFromCachedContent(
                cachedContent,
                { model: this.MODEL_NAME }
            );
        }

        try {
            const debugDir = path.join(process.cwd(), 'debug');
            if (!fs.existsSync(debugDir)) {
                await fs.promises.mkdir(debugDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const debugFile = path.join(debugDir, `ai_prompt_${timestamp}.txt`);
            await fs.promises.writeFile(debugFile, prompt);
        } catch (e) {
            console.warn('[DEBUG] Failed to save AI prompt:', e);
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return this.stripThinkingBlocks(text);
    }

    private stripThinkingBlocks(text: string): string {
        // Remove <analysis>...</analysis> blocks
        const cleanedText = text.replace(/<analysis>[\s\S]*?<\/analysis>/g, '');
        return cleanedText.trim();
    }
}
