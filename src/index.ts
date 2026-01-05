import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { configService } from "./config/ConfigService.js";
import { registerGenerateDocumentationTool } from "./mcp/tools/GenerateDocumentationTool.js";

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

// Register tools
registerGenerateDocumentationTool(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
