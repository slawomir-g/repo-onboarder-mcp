import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GitAnalyzer } from "../git/GitAnalyzer.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables as early as possible
// CRITICAL: Redirect console.log to console.error to prevent stdout pollution
// which breaks the MCP protocol (badly behaved dependencies like dotenv might log to stdout)
// eslint-disable-next-line no-console
console.log = console.error;

dotenv.config();

import * as fsSync from "fs";

const server = new McpServer({
  name: "repo-onboarder",
  version: "1.0.0",
});

function resolvePromptsDir(): string {
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  // Try dist path (production/compiled)
  const distPath = path.resolve(currentDir, '../prompts');
  if (fsSync.existsSync(path.join(distPath, 'readme-prompt-template.md'))) {
      return distPath;
  }
  // Try src path (development)
  const srcPath = path.resolve(currentDir, '../prompts/prompts');
  if (fsSync.existsSync(path.join(srcPath, 'readme-prompt-template.md'))) {
      return srcPath;
  }
  // Fallback to dist path if detection fails
  return distPath;
}

const gitAnalyzer = new GitAnalyzer({ promptsDir: resolvePromptsDir() });

server.registerTool(
  "generateDocumentation",
  {
    description: "Analyzes a Git or local repository and generates documentation",
    inputSchema: {
      repoUrl: z.string().optional().describe("The URL of the Git repository to analyze (optional if projectPath provided)"),
      projectPath: z.string().optional().describe("The absolute path to the local repository to analyze (optional if repoUrl provided)"),
      branch: z.string().default("master").describe("The branch to analyze (default: master)"),
      withTest: z.boolean().default(false).describe("Whether to include test files in analysis (default: false)"),
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
        withTest: args.withTest,
        targetLanguage: args.targetLanguage
      });

      // Handle file writing if outputDir is provided
      let savedPathMsg = "";
      if (args.outputDir) {
        let targetDir = args.outputDir;
        
        // If it's a local repo and outputDir is relative, resolve it against projectPath
        if (args.projectPath && !path.isAbsolute(args.outputDir)) {
          targetDir = path.resolve(args.projectPath, args.outputDir);
        } else if (!path.isAbsolute(args.outputDir)) {
             // For remote repos or if projectPath missing (unlikely for write), ensure we have a safe place or error? 
             // For now, if no projectPath, assume outputDir is absolute or relative to CWD (server CWD).
             targetDir = path.resolve(process.cwd(), args.outputDir);
        }

        await fs.mkdir(targetDir, { recursive: true });

        for (const [docType, content] of Object.entries(result.documents)) {
             const filename = `${docType.toLowerCase().replace(/\s+/g, '-')}.md`;
             await fs.writeFile(path.join(targetDir, filename), content, 'utf-8');
        }
        savedPathMsg = `\n\n✅ Files have been successfully written to: ${targetDir}`;
      }

      // Format the output for MCP
      let content = "";
      if (args.outputDir) {
          content = `DOCUMENTATION GENERATED.\n\nFiles have been successfully written to: ${path.resolve(args.projectPath || process.cwd(), args.outputDir)}`;
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
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing repository: ${error.message}`,
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
