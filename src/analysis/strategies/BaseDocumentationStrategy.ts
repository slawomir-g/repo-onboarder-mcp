import type { DocumentationStrategy, GenerationContext } from "./DocumentationStrategy.js";

export abstract class BaseDocumentationStrategy implements DocumentationStrategy {
  abstract key: string;
  protected abstract promptTemplate: string;
  protected abstract docTemplate: string;

  async generate(context: GenerationContext): Promise<{ key: string; content: string }> {
    try {
      const prompt = await context.promptService.constructPrompt(
        context.contextXml,
        this.promptTemplate,
        this.docTemplate,
        context.targetLanguage,
        context.cacheObject?.name,
      );

      const content = await context.geminiService.generateContent(prompt, context.cacheObject);
      return { key: this.key, content };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Failed ${this.key}: ${errorMessage}`);
      return { key: this.key, content: `Error generating ${this.key}: ${errorMessage}` };
    }
  }
}
