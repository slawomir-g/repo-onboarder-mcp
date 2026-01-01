import { BaseDocumentationStrategy } from './BaseDocumentationStrategy.js';

export class QualityAssessmentStrategy extends BaseDocumentationStrategy {
    key = "Quality Assessment";
    protected promptTemplate = 'quality-assessment-prompt-template.md';
    protected docTemplate = 'quality-assessment-documentation-template.md';
}
