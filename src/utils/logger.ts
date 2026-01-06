import { createLoggerSync } from "@toolprint/mcp-logger";

// Initialize the logger instance
// Using default settings which should be safe for MCP (stdout suppression)
export const logger = createLoggerSync();
