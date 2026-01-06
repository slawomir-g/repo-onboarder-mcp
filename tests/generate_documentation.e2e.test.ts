import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Mock E2E Documentation Generation", () => {
  let client: Client;
  let transport: StdioClientTransport;
  const projectPath = path.resolve(__dirname, "fixtures/simple_repo");
  const outputDir = path.join(__dirname, "output");

  beforeAll(async () => {
    // Cleanup output directory
    await fs.promises.rm(outputDir, { recursive: true, force: true });
    
    // Path to the MCP server entry point
    const serverScriptPath = path.resolve(__dirname, "mocks/server_entry.ts");

    transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", serverScriptPath],
      stderr: "inherit",
    });

    client = new Client(
      {
        name: "test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
  });

  it("should generate documentation using mocked Gemini service", async () => {
    const toolName = "generateDocumentation";
    
    const result = await client.callTool({
      name: toolName,
      arguments: {
        projectPath: projectPath,
        outputDir: outputDir,
        includeTests: false,
        targetLanguage: "English",
      },
    });

    // Verify tool execution was successful
    expect((result as { isError?: boolean }).isError).toBeFalsy();

    // Validation
    const expectedFile = path.join(outputDir, "readme.md");
    expect(fs.existsSync(expectedFile)).toBeTruthy();

    const content = fs.readFileSync(expectedFile, "utf-8");
    expect(content).toContain("# Mock Documentation");
    expect(content).toContain("This is a mocked response from Gemini");
  });
});
