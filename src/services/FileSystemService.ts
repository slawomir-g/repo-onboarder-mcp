import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

export class FileSystemService {
  /**
   * Resolves the output directory path.
   * If outputDir is relative, it is resolved against:
   * 1. projectPath if provided
   * 2. process.cwd() otherwise
   */
  resolveOutputDirectory(outputDir: string, projectPath?: string): string {
    if (path.isAbsolute(outputDir)) {
      return outputDir;
    }
    
    if (projectPath) {
      return path.resolve(projectPath, outputDir);
    }
    
    return path.resolve(process.cwd(), outputDir);
  }

  /**
   * Writes key-value pairs of filename -> content to the target directory.
   * Transforms keys (e.g. "README") into filenames (e.g. "readme.md").
   */
  async writeGeneratedDocuments(targetDir: string, documents: Record<string, string>): Promise<void> {
    await fs.mkdir(targetDir, { recursive: true });

    for (const [docType, content] of Object.entries(documents)) {
      const filename = `${docType.toLowerCase().replace(/\s+/g, '-')}.md`;
      await fs.writeFile(path.join(targetDir, filename), content, 'utf-8');
    }
  }

  /**
   * Resolves the directory containing prompt templates.
   * Adapts to being run from src (dev) or dist (prod).
   */
  resolvePromptsDir(): string {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    
    // Logic adapted from src/mcp/index.ts
    // Assuming structure:
    // src/services/FileSystemService.ts
    // src/prompts/prompts/*.md
    //
    // dist/services/FileSystemService.js
    // dist/prompts/*.md (potentially flattened in build?) OR dist/prompts/prompts/*.md
    
    // In original code (src/mcp/index.ts):
    // const distPath = path.resolve(currentDir, '../prompts'); // -> src/prompts
    // checks for 'readme-prompt-template.md' directly in src/prompts
    
    // const srcPath = path.resolve(currentDir, '../prompts/prompts'); // -> src/prompts/prompts
    // checks for 'readme-prompt-template.md' in src/prompts/prompts
    
    // Note: In our current fs check, the files ARE in src/prompts/prompts.
    // So the 'distPath' check in original code (checking ../prompts) would FAIL in dev environment.
    // Use the same logic.

    const distPath = path.resolve(currentDir, '../prompts');
    if (fsSync.existsSync(path.join(distPath, 'readme-prompt-template.md'))) {
        return distPath;
    }

    const srcPath = path.resolve(currentDir, '../prompts/prompts');
    if (fsSync.existsSync(path.join(srcPath, 'readme-prompt-template.md'))) {
        return srcPath;
    }

    // Fallback
    return distPath;
  }
}
