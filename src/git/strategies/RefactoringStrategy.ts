import { BaseDocumentationStrategy } from './BaseDocumentationStrategy.js';

export class RefactoringStrategy extends BaseDocumentationStrategy {
    key = "Refactoring";
    protected promptTemplate = 'refactoring-prompt-template.md';
    protected docTemplate = 'refactoring-documentation-template.md';
}
