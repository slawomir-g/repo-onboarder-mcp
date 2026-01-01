import * as fs from 'fs';
import * as path from 'path';
import { create } from 'xmlbuilder2';
import { FileContent } from '../git/RepoCollector.js';

export class PromptService {
    
    private promptsDir: string;

    constructor(promptsDir: string) {
        this.promptsDir = promptsDir;
    }

    async loadTemplate(templateName: string): Promise<string> {
        const templatePath = path.join(this.promptsDir, templateName);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }
        return fs.promises.readFile(templatePath, 'utf-8');
    }

    async constructPrompt(
        repositoryContextXml: string,
        promptTemplateName: string,
        documentationTemplateName: string,
        targetLanguage?: string,
        cachedContentName?: string,
        generatedDocumentationPayload?: string
    ): Promise<string> {
        const promptTemplate = await this.loadTemplate(promptTemplateName);
        const documentationTemplate = await this.loadTemplate(documentationTemplateName);
        
        let languageInstruction = "";
        if (targetLanguage) {
             languageInstruction = `- IMPORTANT: Response MUST be in ${targetLanguage} language`;
        }

        let prompt = promptTemplate;
        
        if (cachedContentName) {
            // If we are using valid cached content, we don't need to inject the XML into the prompt
            // logic: The model already has the context found in repositoryContextXml
            prompt = prompt.replace('$REPOSITORY_CONTEXT_PAYLOAD_PLACEHOLDER$', '(Context provided via Context Caching)');
        } else {
            console.error("Repository context XML not provided");
            // prompt = prompt.replace('$REPOSITORY_CONTEXT_PAYLOAD_PLACEHOLDER$', repositoryContextXml);
        }

        prompt = prompt.replace('$DOCUMENTATION_TEMPLATE$', documentationTemplate);
        prompt = prompt.replace('$LANGUAGE_INSTRUCTION$', languageInstruction);

        if (generatedDocumentationPayload) {
            prompt = prompt.replace('$GENERATED_DOCUMENTATION_PLACEHOLDER$', generatedDocumentationPayload);
        } else {
            prompt = prompt.replace('$GENERATED_DOCUMENTATION_PLACEHOLDER$', '');
        }

        // Save generated prompt to debug file
        try {
            const debugDir = path.join(process.cwd(), 'debug');
            if (!fs.existsSync(debugDir)) {
                await fs.promises.mkdir(debugDir, { recursive: true });
            }
            const cleanTemplateName = path.parse(promptTemplateName).name;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const debugFile = path.join(debugDir, `prepared_prompt_${cleanTemplateName}_${timestamp}.txt`);
            
            await fs.promises.writeFile(debugFile, prompt);
        } catch (e: any) {
            console.warn(`[DEBUG] Failed to save prepared prompt: ${e.message}`);
        }

        return prompt;
    }

    async constructRepositoryContext(
        projectName: string,
        timestamp: string,
        branch: string,
        directoryTreePayload: string,
        sourceCodeFiles: FileContent[],
        hotspots: any[] = [],
        commits: any[] = []
    ): Promise<string> {
        // Building XML with xmlbuilder2 for safety
        const root = create({ version: '1.0' })
            .ele('repository_context')
                .ele('project_name').txt(projectName).up()
                .ele('analysis_timestamp').txt(timestamp).up()
                .ele('branch').txt(branch).up()
                .ele('directory_tree').txt(directoryTreePayload).up();

        // Source Code Corpus
        const corpusNode = root.ele('source_code_corpus');
        for (const file of sourceCodeFiles) {
            try {
                const sanitized = this.sanitizeForXml(file.content);
                corpusNode.ele('file', { path: file.path })
                    .dat(sanitized) // Use CDATA for file content to avoid escaping issues
                    .up();
            } catch (e: any) {
                console.error(`ERROR: Failed to add file to XML: ${file.path}`);
                console.error(`Error message: ${e.message}`);
                // Skip problematic file but proceed
            }
        }
        corpusNode.up();

        // Hotspots
        const hotspotsNode = root.ele('hotspots');
        for (const h of hotspots) {
            hotspotsNode.ele('file', { path: h.path })
                .ele('commits').txt(String(h.commits)).up()
                .ele('lines_added').txt(String(h.linesAdded)).up()
                .ele('lines_deleted').txt(String(h.linesDeleted)).up()
                .up();
        }
        hotspotsNode.up();

        // Commit History
        const historyNode = root.ele('commit_history');
        for (const c of commits) {
            historyNode.ele('commit', { id: c.shortId })
                .ele('author').txt(this.sanitizeForXml(c.authorName)).up()
                .ele('date').txt(c.authorTime).up()
                .ele('message').txt(this.sanitizeForXml(c.messageShort)).up()
                .ele('files_changed', { count: String(c.filesChanged) }).up()
                .ele('stats', { insertions: String(c.insertions), deletions: String(c.deletions) }).up()
                .up();
        }
        historyNode.up();
        
        // Return valid XML string
        return root.end({ prettyPrint: true });
    }

    private sanitizeForXml(content: string): string {
        if (!content) return '';
        // Remove invalid XML characters: control characters 0-31 excluding 9 (tab), 10 (LF), 13 (CR)
        return content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
}
