import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AnalysisOrchestrator } from "../git/AnalysisOrchestrator.js";
import { configService } from "../config/ConfigService.js";
import { FileSystemService } from "../services/FileSystemService.js";

// Load environment variables as early as possible
// CRITICAL: Redirect console.log to console.error to prevent stdout pollution
// which breaks the MCP protocol (badly behaved dependencies like dotenv might log to stdout)
// eslint-disable-next-line no-console
console.log = console.error;

// ConfigService is imported above, which triggers dotenv.config() logic internally
console.error(`Starting repo-onboarder-mcp in ${configService.NODE_ENV} mode`);

const server = new McpServer({
  name: "repo-onboarder",
  version: "1.0.0",
});

const fileSystemService = new FileSystemService();
const gitAnalyzer = new AnalysisOrchestrator({ promptsDir: fileSystemService.resolvePromptsDir() });

server.registerTool(
  "generateDocumentation",
  {
    description: "Analyzes a Git or local repository and generates documentation",
    inputSchema: {
      repoUrl: z.string().optional().describe("The URL of the Git repository to analyze (optional if projectPath provided)"),
      projectPath: z.string().optional().describe("The absolute path to the local repository to analyze (optional if repoUrl provided)"),
      branch: z.string().default("master").describe("The branch to analyze (default: master)"),
      includeTests: z.boolean().default(false).describe("Whether to include test files in analysis (default: false)"),
      targetLanguage: z.string().default("English").optional().describe("The target language for the generated documentation (e.g., 'English', 'Polish')"),
      outputDir: z.string().optional().describe("Directory to write generated documentation to (relative to projectPath for local repos, or absolute). If provided, files will be written to disk.")
    }
  },
  async (args) => {
    try {
      const result = await gitAnalyzer.analyze({
        repoUrl: args.repoUrl,
        projectPath: args.projectPath,
        branch: args.branch,
        includeTests: args.includeTests,
        targetLanguage: args.targetLanguage
      });

      // Handle file writing if outputDir is provided
      if (args.outputDir) {
        const targetDir = fileSystemService.resolveOutputDirectory(args.outputDir, args.projectPath);
        await fileSystemService.writeGeneratedDocuments(targetDir, result.documents);
      }

      // Format the output for MCP
      let content = "";
      if (args.outputDir) {
          const targetDir = fileSystemService.resolveOutputDirectory(args.outputDir, args.projectPath);
          content = `DOCUMENTATION GENERATED.\n\nFiles have been successfully written to: ${targetDir}`;
      } else {
          const introText = `RECOMMENDATION: The following documentation MD files are generated for your project. Be aware that it will overwrite existing files. It is suggested to save them in a \`docs/\` directory at the root of your project, or another location if preferred.`;
          
          content = [introText, ...Object.entries(result.documents)
            .map(([type, text]) => `## ${type}\n\n${text}`)]
            .join("\n\n---\n\n");
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
