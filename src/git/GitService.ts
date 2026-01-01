import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';

export class GitService {
    private git: SimpleGit;

    constructor(baseDir?: string) {
        this.git = simpleGit(baseDir);
    }

    /**
     * Clones a repository to a specific directory.
     * @param repoUrl The URL of the repository to clone.
     * @param targetDir The directory where the repository should be cloned.
     * @param branch Optional branch to checkout.
     */
    async cloneRepo(repoUrl: string, targetDir: string, branch?: string): Promise<void> {
        // Ensure parent directory exists
        await fs.promises.mkdir(targetDir, { recursive: true });


        
        const cloneOptions: any = {
           '--depth': 1,
        };
        
        if (branch) {
            cloneOptions['--branch'] = branch;
        }

        await this.git.clone(repoUrl, targetDir, cloneOptions);

    }

    /**
     * Checks out a specific branch.
     * @param repoDir The directory of the repository.
     * @param branch The branch name to checkout.
     */
    async checkout(repoDir: string, branch: string): Promise<void> {
         const gitRepo = simpleGit(repoDir);
         await gitRepo.checkout(branch);
    }
}
