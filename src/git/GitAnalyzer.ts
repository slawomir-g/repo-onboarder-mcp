import * as path from 'path';
import { RepoCollector } from '../git/RepoCollector.js';
import { GitCommitCollector } from '../git/GitCommitCollector.js';
import { PromptService } from '../ai/PromptService.js';
import { GeminiService } from '../ai/GeminiService.js';
import { RepositoryManager } from './RepositoryManager.js';

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

interface DocTypeConfig {
    key: string;
    promptTemplate: string;
    docTemplate: string;
}

const DOCUMENTATION_TYPES: DocTypeConfig[] = [
    { key: "README", promptTemplate: 'readme-prompt-template.md', docTemplate: 'readme-documentation-template.md' },
    { key: "AI Context", promptTemplate: 'ai-context-prompt-template.md', docTemplate: 'ai-context-documentation-template.md' },
    { key: "DDD Refactoring", promptTemplate: 'ddd-refactoring-prompt-template.md', docTemplate: 'ddd-refactoring-template.md' },
    { key: "Dictionary", promptTemplate: 'dictionary-prompt-template.md', docTemplate: 'dictionary-documentation-template.md' },
    { key: "Quality Assessment", promptTemplate: 'quality-assessment-prompt-template.md', docTemplate: 'quality-assessment-documentation-template.md' },
    { key: "Refactoring", promptTemplate: 'refactoring-prompt-template.md', docTemplate: 'refactoring-documentation-template.md' }
];

export class GitAnalyzer {
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
            repoDir = await repositoryManager.prepare(request);
            
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
            const cacheName = cacheObject.name;

            // 5. Generate All Documentation Types concurrently
            const documents: Record<string, string> = {};

            const generations = DOCUMENTATION_TYPES.map(async (config) => {
                try {
                    const prompt = await this.promptService.constructPrompt(
                        contextXml,
                        config.promptTemplate,
                        config.docTemplate,
                        request.targetLanguage,
                        cacheName
                    );
                    const content = await this.geminiService.generateContent(prompt, cacheObject);
                    return { key: config.key, content };
                } catch (err: any) {
                    console.error(`Failed ${config.key}: ${err.message}`);
                    return { key: config.key, content: `Error generating ${config.key}: ${err.message}` };
                }
            });

            const results = await Promise.all(generations);
            
            for (const result of results) {
                documents[result.key] = result.content;
            }

            // 6. Judge Documentation
            try {
                // Generating Judge Documentation (Evaluation)...
                const generatedDocsPayload = Object.entries(documents)
                    .map(([key, content]) => `<document name="${key}">\n${content}\n</document>`)
                    .join('\n\n');

                const judgeConfig = {
                    key: "Evaluation",
                    promptTemplate: 'judge-validation-template.md',
                    docTemplate: 'judge-documentation-template.md'
                };
                
                const prompt = await this.promptService.constructPrompt(
                    contextXml,
                    judgeConfig.promptTemplate,
                    judgeConfig.docTemplate,
                    request.targetLanguage,
                    cacheName,
                    generatedDocsPayload
                );

                const content = await this.geminiService.generateContent(prompt, cacheObject);
                documents[judgeConfig.key] = content;

            } catch (err: any) {
                console.error(`Failed Judge Documentation: ${err.message}`);
                // Don't fail the whole request, just add error doc
                documents['Evaluation'] = `Error generating evaluation: ${err.message}`;
            }

             return { documents };

        } finally {
            await repositoryManager.cleanup();
        }
    }
}
