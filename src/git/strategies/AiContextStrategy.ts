import { BaseDocumentationStrategy } from './BaseDocumentationStrategy.js';

export class AiContextStrategy extends BaseDocumentationStrategy {
    key = "AI Context";
    protected promptTemplate = 'ai-context-prompt-template.md';
    protected docTemplate = 'ai-context-documentation-template.md';
}
