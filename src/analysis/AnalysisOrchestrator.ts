import * as fs from "node:fs";
import * as path from "node:path";
import { GeminiService } from "../ai/GeminiService.js";
import type { IGeminiService } from "../ai/IGeminiService.js";
import { PromptService } from "../ai/PromptService.js";
import { GitCommitCollector } from "../git/GitCommitCollector.js";
import { ProjectCollector } from "./ProjectCollector.js";

import { AiContextStrategy } from "./strategies/AiContextStrategy.js";
import { DddRefactoringStrategy } from "./strategies/DddRefactoringStrategy.js";
import { DictionaryStrategy } from "./strategies/DictionaryStrategy.js";
import { EvaluationStrategy } from "./strategies/EvaluationStrategy.js";
import { QualityAssessmentStrategy } from "./strategies/QualityAssessmentStrategy.js";
import { ReadmeStrategy } from "./strategies/ReadmeStrategy.js";
import { RefactoringStrategy } from "./strategies/RefactoringStrategy.js";

export interface AnalysisRequest {
  projectPath: string; // Local path to analyze

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
  private geminiService: IGeminiService;

  constructor(config: { promptsDir: string }, geminiService: IGeminiService) {
    this.projectCollector = new ProjectCollector();
    this.gitCommitCollector = new GitCommitCollector();
    this.promptService = new PromptService(config.promptsDir);
    this.geminiService = geminiService;
  }

  async analyze(request: AnalysisRequest): Promise<DocumentationResult> {
    const repoDir = path.resolve(request.projectPath);
    if (!fs.existsSync(repoDir)) {
      throw new Error(`Project path does not exist: ${repoDir}`);
    }

    // 2. Collect Data
    const sourceCodePayload = await this.projectCollector.collectFiles(repoDir, request.includeTests);
    const directoryTreePayload = await this.projectCollector.collectDirectoryStructure(repoDir);

    // Collect Churn & Commit History
    const commitCollection = await this.gitCommitCollector.collect(repoDir);

    // 3. Prepare Context
    const projectName = path.basename(request.projectPath);

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
      "HEAD",
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
  }
}
