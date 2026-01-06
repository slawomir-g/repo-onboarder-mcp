import * as fs from "node:fs";
import * as path from "node:path";
import { configService } from "../config/ConfigService.js";

import { logger } from "./logger.js";

const DEBUG_DIR = path.join(process.cwd(), "debug");

async function ensureDebugDir(): Promise<void> {
  if (!configService.DEBUG_MODE) return;

  try {
    if (!fs.existsSync(DEBUG_DIR)) {
      await fs.promises.mkdir(DEBUG_DIR, { recursive: true });
    }
  } catch (error) {
    logger.warn(`[DEBUG] Failed to create debug directory: ${error}`);
  }
}

export const DebugLogger = {
  async log(filename: string, content: string, extension = "md"): Promise<void> {
    if (!configService.DEBUG_MODE) return;

    try {
      await ensureDebugDir();
      const filePath = path.join(DEBUG_DIR, `${filename}.${extension}`);
      await fs.promises.writeFile(filePath, content, "utf-8");
    } catch (error) {
      logger.warn(`[DEBUG] Failed to write debug log ${filename}: ${error}`);
    }
  },
};
