import { BaseDocumentationStrategy } from './BaseDocumentationStrategy.js';
import { GenerationContext } from './DocumentationStrategy.js';

export class EvaluationStrategy extends BaseDocumentationStrategy {
    key = "Evaluation";
    protected promptTemplate = 'judge-validation-template.md';
    protected docTemplate = 'judge-documentation-template.md';

    override async generate(context: GenerationContext): Promise<{ key: string, content: string }> {
        if (!context.generatedDocs) {
             console.error(`Failed ${this.key}: Generated docs payload missing`);
             return { key: this.key, content: `Error generating ${this.key}: Generated docs payload missing` };
        }

        const generatedDocsPayload = Object.entries(context.generatedDocs)
            .map(([key, content]) => `<document name="${key}">\n${content}\n</document>`)
            .join('\n\n');

        try {
            const prompt = await context.promptService.constructPrompt(
                context.contextXml,
                this.promptTemplate,
                this.docTemplate,
                context.targetLanguage,
                context.cacheObject?.name,
                generatedDocsPayload
            );

            const content = await context.geminiService.generateContent(prompt, context.cacheObject);
            return { key: this.key, content };

        } catch (err: unknown) {
             const errorMessage = err instanceof Error ? err.message : String(err);
             console.error(`Failed Judge Documentation: ${errorMessage}`);
             return { key: this.key, content: `Error generating evaluation: ${errorMessage}` };
        }
    }
}
