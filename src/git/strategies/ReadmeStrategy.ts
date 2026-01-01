import { BaseDocumentationStrategy } from './BaseDocumentationStrategy.js';

export class ReadmeStrategy extends BaseDocumentationStrategy {
    key = "README";
    protected promptTemplate = 'readme-prompt-template.md';
    protected docTemplate = 'readme-documentation-template.md';
}
