import { BaseDocumentationStrategy } from './BaseDocumentationStrategy.js';

export class DictionaryStrategy extends BaseDocumentationStrategy {
    key = "Dictionary";
    protected promptTemplate = 'dictionary-prompt-template.md';
    protected docTemplate = 'dictionary-documentation-template.md';
}
