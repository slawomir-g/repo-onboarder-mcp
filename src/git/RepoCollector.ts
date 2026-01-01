import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';
import { isBinaryFile } from 'isbinaryfile';
import { DebugLogger } from '../utils/DebugLogger.js';

export interface FileContent {
    path: string;
    content: string;
}

interface TreeNode {
    [key: string]: TreeNode;
}

export class RepoCollector {
    
    /**
     * Collects all text files in the repository.
     * @param repoDir The root directory of the repository.
     * @param includeTests Whether to include test files.
     * @returns A string in XML format containing file contents.
     */
    async collectFiles(repoDir: string, includeTests: boolean = false): Promise<FileContent[]> {
        const ig = ignore();
        const gitignorePath = path.join(repoDir, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf-8');
            ig.add(gitignoreContent);
        }
        // Always ignore .git directory explicitly, although we also filter it in getAllFiles for safety
        ig.add('.git');

        const files = await this.getAllFiles(repoDir, repoDir, ig);
        const sortedFiles = files.sort();
        
        const fileContents: FileContent[] = [];

        for (const filePath of sortedFiles) {
             const relativePath = path.relative(repoDir, filePath);
             
             // Simple filtering logic similar to Java implementation
             if (!includeTests && (relativePath.toLowerCase().includes('test'))) {
                 continue;
             }

             if (!await this.isTextFile(filePath)) {
                 continue;
             }

             try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                fileContents.push({ path: relativePath, content });
             } catch (e) {
                 console.warn(`Failed to read file ${filePath}:`, e);
             }
        }
        
        try {
            await DebugLogger.log('repo_snapshot', JSON.stringify(fileContents, null, 2), 'json');
            // console.error(`[DEBUG] Saved repo snapshot to ${debugFile}`);
        } catch (e) {
            console.warn('[DEBUG] Failed to save repo snapshot:', e);
        }

        return fileContents;
    }

    async collectDirectoryStructure(repoDir: string): Promise<string> {
        const ig = ignore();
        const gitignorePath = path.join(repoDir, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf-8');
            ig.add(gitignoreContent);
        }
        ig.add('.git');

        const files = await this.getAllFiles(repoDir, repoDir, ig);
        const relativeFiles = files.map(f => path.relative(repoDir, f)).sort();

        return this.generateAsciiTree(relativeFiles);
    }

    private generateAsciiTree(files: string[]): string {
        const root: TreeNode = {};
        for (const file of files) {
            const parts = file.split(path.sep);
            let current = root;
            for (const part of parts) {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }

        return this.printTree(root, '');
    }

    private printTree(node: TreeNode, prefix: string): string {
        let output = '';
        const keys = Object.keys(node).sort();
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const isLast = i === keys.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            output += `${prefix}${connector}${key}\n`;
            
            const children = node[key];
            if (Object.keys(children).length > 0) {
                 output += this.printTree(children, prefix + (isLast ? '    ' : '│   '));
            }
        }
        return output;
    }

    private async getAllFiles(currentDir: string, rootDir: string, ig: ReturnType<typeof ignore>): Promise<string[]> {
        let results: string[] = [];
        const list = await fs.promises.readdir(currentDir);
        
        for (const file of list) {
            const filePath = path.resolve(currentDir, file);
            const relativePath = path.relative(rootDir, filePath);
            
            try {
                // Ensure correct relative path handling for ignoring
                // Ignore package expects forward slashes, assuming path.relative gives platform specific sep
                // But on local run, it should match.
                
                if (ig.ignores(relativePath)) {
                    continue;
                }
            } catch (e) {
                console.warn(`Error checking ignore for ${relativePath}:`, e);
            }

            const stat = await fs.promises.stat(filePath);
            
            if (stat && stat.isDirectory()) {
                const res = await this.getAllFiles(filePath, rootDir, ig);
                results = results.concat(res);
            } else {
                results.push(filePath);
            }
        }
        return results;
    }

    // Check if a file is binary using isbinaryfile library
    private async isTextFile(filePath: string): Promise<boolean> {
        try {
            const isBinary = await isBinaryFile(filePath);
            return !isBinary;
        } catch (error) {
            console.warn(`Failed to check if file is binary: ${filePath}`, error);
            // Fallback to extension check if binary check fails
            const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.jar', '.class', '.exe', '.bin'];
            const ext = path.extname(filePath).toLowerCase();
            return !binaryExtensions.includes(ext);
        }
    }
}
