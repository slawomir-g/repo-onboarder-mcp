import type { IGeminiService } from "../../ai/IGeminiService.js";
import type { PromptService } from "../../ai/PromptService.js";

export interface GenerationContext {
  promptService: PromptService;
  geminiService: IGeminiService;
  contextXml: string;
  // biome-ignore lint/suspicious/noExplicitAny: library interaction
  cacheObject?: any;
  targetLanguage?: string;
  // Optional because not all strategies need it, but Evaluation does
  generatedDocs?: Record<string, string>;
}

export interface DocumentationStrategy {
  key: string;
  generate(context: GenerationContext): Promise<{ key: string; content: string }>;
}
