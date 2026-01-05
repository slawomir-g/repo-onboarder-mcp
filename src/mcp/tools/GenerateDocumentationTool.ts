import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AnalysisOrchestrator } from "../../analysis/AnalysisOrchestrator.js";
import { resolvePromptsDir } from "../../utils/FileUtils.js";
import { GenerateDocumentationUseCase } from "../../usecases/GenerateDocumentationUseCase.js";

export function registerGenerateDocumentationTool(server: McpServer) {
  // Initialize dependencies
  // In a full DI setup, these would be injected into registerGenerateDocumentationTool
  const analyzer = new AnalysisOrchestrator({ promptsDir: resolvePromptsDir() });
  const useCase = new GenerateDocumentationUseCase(analyzer);

  server.registerTool(
    "generateDocumentation",
    {
      description: "Analyzes a local git repository and generates documentation",
      inputSchema: {
        projectPath: z
          .string()
          .describe("The absolute path to the local repository to analyze"),

        includeTests: z.boolean().default(false).describe("Whether to include test files in analysis (default: false)"),
        targetLanguage: z
          .string()
          .default("English")
          .optional()
          .describe("The target language for the generated documentation (e.g., 'English', 'Polish')"),
        outputDir: z
          .string()
          .optional()
          .describe(
            "Directory to write generated documentation to (relative to projectPath, or absolute). If provided, files will be written to disk.",
          ),
      },
    },
    async (args) => {
      try {
        const result = await useCase.execute({
          projectPath: args.projectPath,
          includeTests: args.includeTests,
          targetLanguage: args.targetLanguage,
          outputDir: args.outputDir,
        });

        // Format the output for MCP
        let content = "";
        if (result.outputPath) {
          content = `DOCUMENTATION GENERATED.\n\nFiles have been successfully written to: ${result.outputPath}`;
        } else {
          const introText =
            "RECOMMENDATION: The following documentation MD files are generated for your project. Be aware that it will overwrite existing files. It is suggested to save them in a `docs/` directory at the root of your project, or another location if preferred.";

          content = [introText, ...Object.entries(result.documents).map(([type, text]) => `## ${type}\n\n${text}`)].join(
            "\n\n---\n\n",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing repository: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
