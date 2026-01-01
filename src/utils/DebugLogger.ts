import * as fs from 'fs';
import * as path from 'path';

export class DebugLogger {
    private static readonly DEBUG_DIR = path.join(process.cwd(), 'debug');
    
    // Default to true to match previous behavior of always writing, 
    // but allow disabling via environment variable.
    private static get isEnabled(): boolean {
        return process.env.DEBUG_LOGGING !== 'false';
    }

    /**
     * Writes content to a debug file with a timestamped filename.
     * @param baseName The base name for the file (e.g., 'ai_prompt', 'repo_snapshot').
     * @param content The content to write (string).
     * @param extension The file extension (default: 'txt').
     */
    static async log(baseName: string, content: string, extension: string = 'txt'): Promise<void> {
        if (!this.isEnabled) {
            return;
        }

        try {
            if (!fs.existsSync(this.DEBUG_DIR)) {
                await fs.promises.mkdir(this.DEBUG_DIR, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `${baseName}_${timestamp}.${extension}`;
            const filePath = path.join(this.DEBUG_DIR, fileName);

            await fs.promises.writeFile(filePath, content);
            // Optional: Log to console that debug file was written (as seen in RepoCollector)
            // But usually we want to keep console clean. 
            // RepoCollector had: console.error(`[DEBUG] Saved repo snapshot...`);
            // Others had only console.warn on error.
            // I will err on side of silence for success, but warn on error.
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.warn(`[DEBUG] Failed to save debug file ${baseName}:`, errorMessage);
        }
    }
}
