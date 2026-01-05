import * as path from "node:path";
import { GeminiService } from "../ai/GeminiService.js";
import { PromptService } from "../ai/PromptService.js";
import { GitCommitCollector } from "../git/GitCommitCollector.js";
import { ProjectCollector } from "../workspace/ProjectCollector.js";
import { WorkspaceManager } from "../workspace/WorkspaceManager.js";
import { AiContextStrategy } from "./strategies/AiContextStrategy.js";
import { DddRefactoringStrategy } from "./strategies/DddRefactoringStrategy.js";
import { DictionaryStrategy } from "./strategies/DictionaryStrategy.js";
import { EvaluationStrategy } from "./strategies/EvaluationStrategy.js";
import { QualityAssessmentStrategy } from "./strategies/QualityAssessmentStrategy.js";
import { ReadmeStrategy } from "./strategies/ReadmeStrategy.js";
import { RefactoringStrategy } from "./strategies/RefactoringStrategy.js";

export interface AnalysisRequest {
  repoUrl?: string; // Optional if projectPath is provided
  projectPath?: string; // Local path to analyze
  branch?: string;
  includeTests?: boolean;
  targetLanguage?: string;
}

export interface DocumentationResult {
  documents: Record<string, string>;
}

export class AnalysisOrchestrator {
  private projectCollector: ProjectCollector;
  private gitCommitCollector: GitCommitCollector;
  private promptService: PromptService;
  private geminiService: GeminiService;

  constructor(config: { promptsDir: string }) {
    this.projectCollector = new ProjectCollector();
    this.gitCommitCollector = new GitCommitCollector();
    this.promptService = new PromptService(config.promptsDir);
    this.geminiService = new GeminiService();
  }

  async analyze(request: AnalysisRequest): Promise<DocumentationResult> {
    const workspaceManager = new WorkspaceManager();
    let repoDir = "";

    try {
      // 1. Prepare Repository (Clone or Resolve Path)
      repoDir = await workspaceManager.initializeWorkspace(request);

      // 2. Collect Data
      const sourceCodePayload = await this.projectCollector.collectFiles(repoDir, request.includeTests);
      const directoryTreePayload = await this.projectCollector.collectDirectoryStructure(repoDir);

      // Collect Churn & Commit History
      const commitCollection = await this.gitCommitCollector.collect(repoDir);

      // 3. Prepare Context
      const projectName = request.projectPath
        ? path.basename(request.projectPath)
        : // biome-ignore lint/style/noNonNullAssertion: guaranteed by validation logic
          path.basename(request.repoUrl!, ".git");

      // Use the latest commit date as the timestamp to ensure stable context for caching
      // If no commits, fall back to current time
      let timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      if (commitCollection.commits.length > 0) {
        // commits are usually ordered by date desc, so take the first one
        timestamp = commitCollection.commits[0].authorTime;
      }

      const contextXml = await this.promptService.constructRepositoryContext(
        projectName,
        timestamp,
        request.branch || "HEAD",
        directoryTreePayload,
        sourceCodePayload, // Now passing FileContent[]
        commitCollection.hotspots, // Passing raw data
        commitCollection.commits, // Passing raw data
      );

      // 4. Generate Cache
      const cacheObject = await this.geminiService.createCache(contextXml, "text/plain");
      // 5. Generate All Documentation Types concurrently
      const documents: Record<string, string> = {};

      const strategies = [
        new ReadmeStrategy(),
        new AiContextStrategy(),
        new DddRefactoringStrategy(),
        new DictionaryStrategy(),
        new QualityAssessmentStrategy(),
        new RefactoringStrategy(),
      ];

      const generations = strategies.map(async (strategy) => {
        return strategy.generate({
          promptService: this.promptService,
          geminiService: this.geminiService,
          contextXml,
          cacheObject,
          targetLanguage: request.targetLanguage,
        });
      });

      const results = await Promise.all(generations);

      for (const result of results) {
        documents[result.key] = result.content;
      }

      // 6. Judge Documentation
      const evaluationStrategy = new EvaluationStrategy();
      const evaluationResult = await evaluationStrategy.generate({
        promptService: this.promptService,
        geminiService: this.geminiService,
        contextXml,
        cacheObject,
        targetLanguage: request.targetLanguage,
        generatedDocs: documents,
      });
      documents[evaluationResult.key] = evaluationResult.content;

      return { documents };
    } finally {
      await workspaceManager.cleanup();
    }
  }
}
