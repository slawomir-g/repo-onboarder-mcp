import * as path from 'path';
import { RepoCollector } from '../git/RepoCollector.js';
import { GitCommitCollector } from '../git/GitCommitCollector.js';
import { PromptService } from '../ai/PromptService.js';
import { GeminiService } from '../ai/GeminiService.js';
import { RepositoryManager } from './RepositoryManager.js';
import { ReadmeStrategy } from './strategies/ReadmeStrategy.js';
import { AiContextStrategy } from './strategies/AiContextStrategy.js';
import { DddRefactoringStrategy } from './strategies/DddRefactoringStrategy.js';
import { DictionaryStrategy } from './strategies/DictionaryStrategy.js';
import { QualityAssessmentStrategy } from './strategies/QualityAssessmentStrategy.js';
import { RefactoringStrategy } from './strategies/RefactoringStrategy.js';
import { EvaluationStrategy } from './strategies/EvaluationStrategy.js';

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
    private repoCollector: RepoCollector;
    private gitCommitCollector: GitCommitCollector;
    private promptService: PromptService;
    private geminiService: GeminiService;

    constructor(config: { promptsDir: string }) {
        this.repoCollector = new RepoCollector();
        this.gitCommitCollector = new GitCommitCollector();
        this.promptService = new PromptService(config.promptsDir);
        this.geminiService = new GeminiService();
    }

    async analyze(request: AnalysisRequest): Promise<DocumentationResult> {
        const repositoryManager = new RepositoryManager();
        let repoDir = '';

        try {
            // 1. Prepare Repository (Clone or Resolve Path)
            repoDir = await repositoryManager.initializeWorkspace(request);
            
            // 2. Collect Data
            const sourceCodePayload = await this.repoCollector.collectFiles(repoDir, request.includeTests);
            const directoryTreePayload = await this.repoCollector.collectDirectoryStructure(repoDir); 

            // Collect Churn & Commit History
            const commitCollection = await this.gitCommitCollector.collect(repoDir);
            
            // 3. Prepare Context
            const projectName = request.projectPath 
                ? path.basename(request.projectPath) 
                : path.basename(request.repoUrl!, '.git');
                
            // Use the latest commit date as the timestamp to ensure stable context for caching
            // If no commits, fall back to current time
            let timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            if (commitCollection.commits.length > 0) {
                // commits are usually ordered by date desc, so take the first one
                timestamp = commitCollection.commits[0].authorTime; 
            }

            const contextXml = await this.promptService.constructRepositoryContext(
                projectName,
                timestamp,
                request.branch || 'HEAD',
                directoryTreePayload,
                sourceCodePayload, // Now passing FileContent[]
                commitCollection.hotspots, // Passing raw data
                commitCollection.commits   // Passing raw data
            );

            // 4. Generate Cache
            const cacheObject = await this.geminiService.createCache(contextXml, 'text/plain');
            // 5. Generate All Documentation Types concurrently
            const documents: Record<string, string> = {};

            const strategies = [
                new ReadmeStrategy(),
                new AiContextStrategy(),
                new DddRefactoringStrategy(),
                new DictionaryStrategy(),
                new QualityAssessmentStrategy(),
                new RefactoringStrategy()
            ];

            const generations = strategies.map(async (strategy) => {
                return strategy.generate({
                    promptService: this.promptService,
                    geminiService: this.geminiService,
                    contextXml,
                    cacheObject,
                    targetLanguage: request.targetLanguage
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
                generatedDocs: documents
            });
            documents[evaluationResult.key] = evaluationResult.content;

             return { documents };

        } finally {
            await repositoryManager.cleanup();
        }
    }
}
