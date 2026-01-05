import assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
/* eslint-disable no-console */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runLocalTest() {
  console.log("Starting local E2E test...");

  const projectPath = process.cwd();
  const outputDir = path.join(projectPath, "debug");

  // Cleanup debug directory
  await fs.promises.rm(outputDir, { recursive: true, force: true });
  console.log(`Cleaned up directory: ${outputDir}`);

  // Path to the MCP server entry point
  // Resolving from current file (src/mcp/index.e2e.ts) to src/mcp/index.ts
  const serverScriptPath = path.resolve(__dirname, "./index.ts");

  console.log(`Connecting to server at: ${serverScriptPath}`);

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", serverScriptPath],
    stderr: "inherit",
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  try {
    await client.connect(transport);
    console.log("Connected to MCP server.");

    // List tools
    const tools = await client.listTools();
    console.log(
      "Available tools:",
      tools.tools.map((t) => t.name),
    );

    const toolName = "generateDocumentation";
    const tool = tools.tools.find((t) => t.name === toolName);

    assert.ok(tool, `Tool ${toolName} should be available`);

    // Call generateDocumentation
    // Variables projectPath and outputDir are defined at the top function scope

    console.log(`Calling ${toolName} for ${projectPath}...`);

    const result = await client.callTool({
      name: toolName,
      arguments: {
        projectPath: projectPath,
        outputDir: outputDir,
        includeTests: false,
        targetLanguage: "English",
      },
    });

    console.log("Tool execution result:", JSON.stringify(result, null, 2));

    if ((result as { isError?: boolean }).isError) {
      console.error("Tool execution returned an error frame.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runLocalTest();
