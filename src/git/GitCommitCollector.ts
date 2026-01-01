import { simpleGit, SimpleGit } from 'simple-git';

export interface FileChange {
    type: 'ADD' | 'DELETE' | 'MODIFY' | 'RENAME' | 'UNKNOWN';
    oldPath?: string;
    newPath: string;
    linesAdded: number;
    linesDeleted: number;
}

export interface CommitInfo {
    commitId: string;
    shortId: string;
    authorName: string;
    authorEmail: string;
    authorTime: string; // ISO string
    messageShort: string;
    messageFull: string;
    changes: FileChange[];
    filesChanged: number;
    insertions: number;
    deletions: number;
}

export interface FileStats {
    path: string;
    commits: number;
    linesAdded: number;
    linesDeleted: number;
}

export interface CommitCollectionResult {
    commits: CommitInfo[];
    hotspots: FileStats[];
}

export class GitCommitCollector {

    /**
     * Collects commit history and calculates hotspots (churn).
     * @param repoDir The root directory of the repository.
     * @param limit Maximum number of commits to analyze (default 50).
     */
    async collect(repoDir: string, limit: number = 50): Promise<CommitCollectionResult> {
        const git: SimpleGit = simpleGit(repoDir);
        
        // Delimiter to safely separate commits
        const commitDelimiter = '<<<COMMIT_START>>>';
        const headerEndDelimiter = '<<<HEADER_END>>>';
        
        // Format: marker%nHash%nShortHash%nAuthorName%nAuthorEmail%nDateISO%nSubject%nBody%nheaderEndMarker
        const sep = '%n';
        const format = `${commitDelimiter}${sep}%H${sep}%h${sep}%an${sep}%ae${sep}%ai${sep}%s${sep}%b${sep}${headerEndDelimiter}`;
        
        const logOptions = [
            `--format=${format}`,
            '--numstat',
            '--no-merges',
            `-n ${limit}`
        ];

        let rawLog = '';
        try {
            rawLog = await git.raw(['log', ...logOptions]);
        } catch (e) {
            console.warn("Failed to fetch git log, returning empty history.", e);
            return { commits: [], hotspots: [] };
        }

        return this.parseLog(rawLog, commitDelimiter, headerEndDelimiter);
    }

    private parseLog(rawLog: string, commitDelimiter: string, headerEndDelimiter: string): CommitCollectionResult {
        // Split by commit start marker. The first chunk might be empty if the log starts immediately.
        const chunks = rawLog.split(commitDelimiter).filter(c => c.trim().length > 0);

        const commits: CommitInfo[] = [];
        const fileStatsMap = new Map<string, FileStats>();

        for (const chunk of chunks) {
            // Chunk contains: Header fields... headerEndDelimiter ... Diff lines
            const headerEndIndex = chunk.indexOf(headerEndDelimiter);
            if (headerEndIndex === -1) continue;

            const headerPart = chunk.substring(0, headerEndIndex).trim();
            const diffPart = chunk.substring(headerEndIndex + headerEndDelimiter.length).trim();

            // Header fields are separated by newline
            const headerLines = headerPart.split('\n');
            if (headerLines.length < 6) continue; // At least basics

            const commitId = headerLines[0];
            const shortId = headerLines[1];
            const authorName = headerLines[2];
            const authorEmail = headerLines[3];
            const authorTime = headerLines[4];
            const messageShort = headerLines[5];
            const messageFull = headerLines.slice(6).join('\n'); // Join the rest of body lines

            const changes: FileChange[] = [];
            let insertions = 0;
            let deletions = 0;

            if (diffPart) {
                const diffLines = diffPart.split('\n');
                for (const line of diffLines) {
                     // Numstat format: "added  deleted  path" or "added  deleted  oldPath => newPath"
                     // Handle binary files: "-  -  path"
                     const parts = line.split('\t');
                     if (parts.length < 3) continue;

                     let addedStr = parts[0];
                     let deletedStr = parts[1];
                     const pathPart = parts[2];

                     const added = addedStr === '-' ? 0 : parseInt(addedStr, 10) || 0;
                     const deleted = deletedStr === '-' ? 0 : parseInt(deletedStr, 10) || 0;

                     insertions += added;
                     deletions += deleted;

                     // Handle simple renames if git reports them in numstat (depends on git version/config)
                     // Usually numstat just shows the new path or "old => new"
                     // 'simple-git' output for numstat is usually just the path? 
                     // git log --numstat output: "1 1 src/{old.ts => new.ts}" or just "new.ts"
                     // We will treat pathPart as the path.
                     
                     changes.push({
                         type: 'MODIFY', // Default, we don't strictly distinguish ADD/MOD from numstat alone easily
                         newPath: pathPart,
                         linesAdded: added,
                         linesDeleted: deleted
                     });
                     
                     // Hotspots aggregation
                     if (!fileStatsMap.has(pathPart)) {
                         fileStatsMap.set(pathPart, { path: pathPart, commits: 0, linesAdded: 0, linesDeleted: 0 });
                     }
                     const stats = fileStatsMap.get(pathPart)!;
                     stats.commits++;
                     stats.linesAdded += added;
                     stats.linesDeleted += deleted;
                }
            }

            commits.push({
                commitId,
                shortId,
                authorName,
                authorEmail,
                authorTime,
                messageShort,
                messageFull,
                changes,
                filesChanged: changes.length,
                insertions,
                deletions
            });
        }
        
        // Sort hotspots by activity (commits desc)
        const hotspots = Array.from(fileStatsMap.values())
             .sort((a, b) => b.commits - a.commits);

        return { commits, hotspots };
    }
}
