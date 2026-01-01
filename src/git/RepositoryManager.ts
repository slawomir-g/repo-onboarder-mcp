import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { GitService } from './GitService.js';

export class RepositoryManager {
    private gitService: GitService;
    private workDir: string | null = null;
    private repoDir: string | null = null;
    private shouldCleanup: boolean = false;

    constructor() {
        this.gitService = new GitService();
    }

    async initializeWorkspace(request: { repoUrl?: string; projectPath?: string; branch?: string }): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (request.projectPath) {
            // Use local project path directly
            this.repoDir = path.resolve(request.projectPath);
            if (!fs.existsSync(this.repoDir)) {
                throw new Error(`Project path does not exist: ${this.repoDir}`);
            }
            this.shouldCleanup = false;
        } else if (request.repoUrl) {
            // Standard flow: Clone repo to temp dir
            this.workDir = path.join(os.tmpdir(), 'repo-onboarder', timestamp);
            this.repoDir = path.join(this.workDir, 'repo');
            await this.gitService.cloneRepo(request.repoUrl, this.repoDir, request.branch);
            this.shouldCleanup = true;
        } else {
            throw new Error("Either projectPath or repoUrl must be provided");
        }

        return this.repoDir;
    }

    async cleanup(): Promise<void> {
        if (this.shouldCleanup && this.workDir) {
            try {
                await fs.promises.rm(this.workDir, { recursive: true, force: true });
            } catch (e) {
                console.warn('Failed to cleanup working directory:', e);
            }
        }
    }
}
