import { AnalysisOrchestrator, type DocumentationResult } from "../analysis/AnalysisOrchestrator.js";
import { resolveOutputDirectory, writeGeneratedDocuments } from "../utils/FileUtils.js";

export interface GenerateDocumentationCommand {
  projectPath: string;
  includeTests?: boolean;
  targetLanguage?: string;
  outputDir?: string;
}

export interface GenerateDocsResult {
  documents: Record<string, string>;
  outputPath?: string;
}

export class GenerateDocumentationUseCase {
  constructor(private readonly analyzer: AnalysisOrchestrator) {}

  async execute(command: GenerateDocumentationCommand): Promise<GenerateDocsResult> {
    const analysisResult = await this.analyzer.analyze({
      projectPath: command.projectPath,
      includeTests: command.includeTests,
      targetLanguage: command.targetLanguage,
    });

    let outputPath: string | undefined;

    if (command.outputDir) {
      outputPath = resolveOutputDirectory(command.outputDir, command.projectPath);
      await writeGeneratedDocuments(outputPath, analysisResult.documents);
    }

    return {
      documents: analysisResult.documents,
      outputPath,
    };
  }
}
