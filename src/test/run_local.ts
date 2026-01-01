import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runLocalTest() {
    console.error('Starting local E2E test...');

    // Path to the MCP server entry point
    // Resolving from current file (src/test/run_local.ts) to src/mcp/index.ts
    const serverScriptPath = path.resolve(__dirname, '../mcp/index.ts');

    console.error(`Connecting to server at: ${serverScriptPath}`);

    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", serverScriptPath],
    });

    const client = new Client({
        name: "test-client",
        version: "1.0.0",
    }, {
        capabilities: {}
    });

    try {
        await client.connect(transport);
        console.log('Connected to MCP server.');

        // List tools
        const tools = await client.listTools();
        console.log('Available tools:', tools.tools.map(t => t.name));

        const toolName = "generateDocumentation";
        const tool = tools.tools.find(t => t.name === toolName);

        assert.ok(tool, `Tool ${toolName} should be available`);

        // Call generateDocumentation
        const projectPath = process.cwd();
        const outputDir = path.join(projectPath, 'debug', 'e2e_test_output');
        
        console.log(`Calling ${toolName} for ${projectPath}...`);
        
        const result = await client.callTool({
            name: toolName,
            arguments: {
                projectPath: projectPath,
                outputDir: outputDir,
                withTest: false,
                targetLanguage: "English"
            }
        });

        console.log('Tool execution result:', JSON.stringify(result, null, 2));

        if ((result as any).isError) {
             console.error('Tool execution returned an error frame.');
             process.exit(1);
        }

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

runLocalTest();
