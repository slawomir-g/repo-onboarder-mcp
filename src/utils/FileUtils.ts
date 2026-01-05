import * as fsSync from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolves the output directory path.
 * If outputDir is relative, it is resolved against:
 * 1. projectPath if provided
 * 2. process.cwd() otherwise
 */
export function resolveOutputDirectory(outputDir: string, projectPath?: string): string {
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
export async function writeGeneratedDocuments(targetDir: string, documents: Record<string, string>): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true });

  for (const [docType, content] of Object.entries(documents)) {
    const filename = `${docType.toLowerCase().replace(/\s+/g, "-")}.md`;
    await fs.writeFile(path.join(targetDir, filename), content, "utf-8");
  }
}

/**
 * Resolves the directory containing prompt templates.
 * Adapts to being run from src (dev) or dist (prod).
 */
export function resolvePromptsDir(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));

  const distPath = path.resolve(currentDir, "../prompts");
  if (fsSync.existsSync(path.join(distPath, "readme-prompt-template.md"))) {
    return distPath;
  }

  const srcPath = path.resolve(currentDir, "../prompts/prompts");
  if (fsSync.existsSync(path.join(srcPath, "readme-prompt-template.md"))) {
    return srcPath;
  }

  // Fallback
  return distPath;
}
