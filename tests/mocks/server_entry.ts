import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { configService } from "../../src/config/ConfigService.js";
import { registerGenerateDocumentationTool } from "../../src/mcp/tools/GenerateDocumentationTool.js";
import { AnalysisOrchestrator } from "../../src/analysis/AnalysisOrchestrator.js";
import { GenerateDocumentationUseCase } from "../../src/usecases/GenerateDocumentationUseCase.js";
import { resolvePromptsDir } from "../../src/utils/FileUtils.js";
import { MockGeminiService } from "./MockGeminiService.js";

// Load environment variables as early as possible
// eslint-disable-next-line no-console
console.log = console.error;

console.error(`Starting repo-onboarder-mcp TEST SERVER`);

const server = new McpServer({
  name: "repo-onboarder-test",
  version: "1.0.0",
});

// Initialize dependencies with MOCK service
const geminiService = new MockGeminiService();
const analyzer = new AnalysisOrchestrator({ promptsDir: resolvePromptsDir() }, geminiService);
const useCase = new GenerateDocumentationUseCase(analyzer);

// Register tools
registerGenerateDocumentationTool(server, useCase);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
