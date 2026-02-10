import { execSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { removeDirectory, pathExists } from "./file-ops.js";
import type { SourceConfig } from "../workflows/types.js";

/** Default source repository (legacy fallback). */
const DEFAULT_OWNER = "BetssonGroup";
const DEFAULT_NAME = "aidlc-workflow";

function resolveSource(source?: SourceConfig) {
  const owner = source?.owner ?? DEFAULT_OWNER;
  const repo = source?.repo ?? DEFAULT_NAME;
  const url = `https://github.com/${owner}/${repo}.git`;
  return { owner, repo, url };
}

export interface CloneResult {
  localPath: string;
  commitSha: string;
  branch: string;
  cleanup: () => void;
}

/**
 * Clone a workflow source repo into a temporary directory.
 * Uses --depth=1 for a shallow, fast clone.
 *
 * Tries gh repo clone first (authenticated), falls back to git clone.
 */
export async function cloneSource(
  branch = "main",
  source?: SourceConfig
): Promise<CloneResult> {
  const { owner, repo, url } = resolveSource(source);
  const tmpBase = path.join(os.tmpdir(), "fluid-flow-install");
  const tmpDir = path.join(tmpBase, `${repo}-${Date.now()}`);

  if (pathExists(tmpBase)) {
    removeDirectory(tmpBase);
  }

  let cloneSucceeded = false;

  try {
    execSync(
      `gh repo clone ${owner}/${repo} "${tmpDir}" -- --depth=1 --branch ${branch}`,
      { stdio: "pipe", encoding: "utf-8", timeout: 60_000 }
    );
    cloneSucceeded = true;
  } catch {
    // gh not available or not authenticated
  }

  if (!cloneSucceeded) {
    try {
      execSync(
        `git clone --depth=1 --branch ${branch} "${url}" "${tmpDir}"`,
        { stdio: "pipe", encoding: "utf-8", timeout: 60_000 }
      );
      cloneSucceeded = true;
    } catch (err) {
      throw new Error(
        `Failed to clone ${owner}/${repo}. ` +
          `Ensure you have access to the repository and either 'gh' or 'git' is available.\n` +
          `Details: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  let commitSha = "unknown";
  try {
    commitSha = execSync("git rev-parse HEAD", {
      cwd: tmpDir,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {
    // Non-critical
  }

  return {
    localPath: tmpDir,
    commitSha,
    branch,
    cleanup: () => removeDirectory(tmpBase),
  };
}

/**
 * Get the latest commit SHA of a remote repo without cloning.
 */
export function getRemoteHeadSha(
  branch = "main",
  source?: SourceConfig
): string | null {
  const { owner, repo, url } = resolveSource(source);

  try {
    const result = execSync(
      `gh api repos/${owner}/${repo}/commits/${branch} --jq '.sha'`,
      { encoding: "utf-8", stdio: "pipe", timeout: 15_000 }
    ).trim();
    if (result) return result;
  } catch {
    // Fall through
  }

  try {
    const result = execSync(
      `git ls-remote "${url}" refs/heads/${branch}`,
      { encoding: "utf-8", stdio: "pipe", timeout: 15_000 }
    ).trim();
    const sha = result.split("\t")[0];
    if (sha) return sha;
  } catch {
    // Fall through
  }

  return null;
}

/**
 * Get repository info for display purposes.
 */
export function getRepoInfo(source?: SourceConfig) {
  const { owner, repo } = resolveSource(source);
  return {
    owner,
    name: repo,
    url: `https://github.com/${owner}/${repo}`,
    fullName: `${owner}/${repo}`,
  };
}

// -- Commit comparison --------------------------------------------------------

export type FileChangeStatus =
  | "added"
  | "removed"
  | "modified"
  | "renamed"
  | "copied"
  | "changed"
  | "unchanged";

export interface FileChange {
  filename: string;
  status: FileChangeStatus;
  additions: number;
  deletions: number;
  changes: number;
  previousFilename?: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface CompareResult {
  status: string;
  aheadBy: number;
  totalCommits: number;
  commits: CommitInfo[];
  files: FileChange[];
  htmlUrl: string;
}

/**
 * Fetch the most recent commits from a repository.
 */
export function getRecentCommits(
  count = 10,
  branch = "main",
  source?: SourceConfig
): CommitInfo[] | null {
  const { owner, repo } = resolveSource(source);

  try {
    const raw = execSync(
      `gh api "repos/${owner}/${repo}/commits?sha=${branch}&per_page=${count}"`,
      { encoding: "utf-8", stdio: "pipe", timeout: 15_000 }
    );

    const data = JSON.parse(raw) as Array<Record<string, unknown>>;

    return data.map((c) => {
      const commit = c.commit as Record<string, unknown>;
      const author = commit.author as Record<string, unknown>;
      return {
        sha: (c.sha as string) ?? "",
        message: ((commit.message as string) ?? "").split("\n")[0] ?? "",
        author: (author?.name as string) ?? "unknown",
        date: (author?.date as string) ?? "",
      };
    });
  } catch {
    return null;
  }
}

/**
 * Compare two commits using the GitHub API.
 */
export function compareCommits(
  baseSha: string,
  headSha: string,
  source?: SourceConfig
): CompareResult | null {
  const { owner, repo } = resolveSource(source);

  try {
    const raw = execSync(
      `gh api repos/${owner}/${repo}/compare/${baseSha}...${headSha}`,
      { encoding: "utf-8", stdio: "pipe", timeout: 30_000 }
    );

    const data = JSON.parse(raw);

    const commits: CommitInfo[] = (data.commits ?? []).map(
      (c: Record<string, unknown>) => {
        const commit = c.commit as Record<string, unknown>;
        const author = commit.author as Record<string, unknown>;
        return {
          sha: (c.sha as string) ?? "",
          message: ((commit.message as string) ?? "").split("\n")[0] ?? "",
          author: (author?.name as string) ?? "unknown",
          date: (author?.date as string) ?? "",
        };
      }
    );

    const files: FileChange[] = (data.files ?? []).map(
      (f: Record<string, unknown>) => ({
        filename: (f.filename as string) ?? "",
        status: (f.status as FileChangeStatus) ?? "changed",
        additions: (f.additions as number) ?? 0,
        deletions: (f.deletions as number) ?? 0,
        changes: (f.changes as number) ?? 0,
        previousFilename: f.previous_filename as string | undefined,
      })
    );

    return {
      status: (data.status as string) ?? "unknown",
      aheadBy: (data.ahead_by as number) ?? 0,
      totalCommits: (data.total_commits as number) ?? 0,
      commits,
      files,
      htmlUrl: (data.html_url as string) ?? "",
    };
  } catch {
    return null;
  }
}
