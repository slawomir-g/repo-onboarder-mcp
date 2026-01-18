#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { configService } from "./config/ConfigService.js";
import { registerGenerateDocumentationTool } from "./mcp/tools/GenerateDocumentationTool.js";
import { logger } from "./utils/logger.js";

// Load environment variables as early as possible
// ConfigService is imported above, which triggers dotenv.config() logic internally
logger.info(`Starting repo-onboarder-mcp in ${configService.NODE_ENV} mode`);

import { GeminiService } from "./ai/GeminiService.js";
import { AnalysisOrchestrator } from "./analysis/AnalysisOrchestrator.js";
import { GenerateDocumentationUseCase } from "./usecases/GenerateDocumentationUseCase.js";
import { resolvePromptsDir } from "./utils/FileUtils.js";

// ... existing code ...

const server = new McpServer({
  name: "repo-onboarder",
  version: "1.0.0",
});

// Initialize dependencies
const geminiService = new GeminiService();
const analyzer = new AnalysisOrchestrator({ promptsDir: resolvePromptsDir() }, geminiService);
const useCase = new GenerateDocumentationUseCase(analyzer);

// Register tools
registerGenerateDocumentationTool(server, useCase);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  logger.error("Server error:", error);
  process.exit(1);
});
