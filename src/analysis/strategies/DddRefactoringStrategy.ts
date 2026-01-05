import { BaseDocumentationStrategy } from "./BaseDocumentationStrategy.js";

export class DddRefactoringStrategy extends BaseDocumentationStrategy {
  key = "DDD Refactoring";
  protected promptTemplate = "ddd-refactoring-prompt-template.md";
  protected docTemplate = "ddd-refactoring-template.md";
}
