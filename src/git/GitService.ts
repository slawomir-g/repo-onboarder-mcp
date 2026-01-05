
import { type SimpleGit, simpleGit } from "simple-git";

export class GitService {
  private git: SimpleGit;

  constructor(baseDir?: string) {
    this.git = simpleGit(baseDir);
  }




}
