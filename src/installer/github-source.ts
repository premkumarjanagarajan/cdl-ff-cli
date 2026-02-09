import { execSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { removeDirectory, pathExists } from "./file-ops.js";

/** The canonical source repository for Fluid Flow Pro. */
const REPO_URL = "https://github.com/BetssonGroup/aidlc-workflow.git";
const REPO_OWNER = "BetssonGroup";
const REPO_NAME = "aidlc-workflow";

export interface CloneResult {
  /** Path to the cloned directory. */
  localPath: string;
  /** The commit SHA of HEAD. */
  commitSha: string;
  /** The branch that was cloned. */
  branch: string;
  /** Cleanup function — removes the temp directory. */
  cleanup: () => void;
}

/**
 * Clone the Fluid Flow Pro repo into a temporary directory.
 * Uses `--depth=1` for a shallow, fast clone.
 *
 * Tries `gh repo clone` first (uses authenticated GitHub CLI),
 * then falls back to `git clone` with HTTPS.
 */
export async function cloneSource(
  branch = "main"
): Promise<CloneResult> {
  const tmpBase = path.join(os.tmpdir(), "fluid-flow-install");
  const tmpDir = path.join(tmpBase, `aidlc-${Date.now()}`);

  // Clean up any stale temp dirs
  if (pathExists(tmpBase)) {
    removeDirectory(tmpBase);
  }

  // Try gh CLI first (respects authentication), then git clone
  let cloneSucceeded = false;

  try {
    execSync(
      `gh repo clone ${REPO_OWNER}/${REPO_NAME} "${tmpDir}" -- --depth=1 --branch ${branch}`,
      { stdio: "pipe", encoding: "utf-8", timeout: 60_000 }
    );
    cloneSucceeded = true;
  } catch {
    // gh not available or not authenticated — fall back to git
  }

  if (!cloneSucceeded) {
    try {
      execSync(
        `git clone --depth=1 --branch ${branch} "${REPO_URL}" "${tmpDir}"`,
        { stdio: "pipe", encoding: "utf-8", timeout: 60_000 }
      );
      cloneSucceeded = true;
    } catch (err) {
      throw new Error(
        `Failed to clone ${REPO_OWNER}/${REPO_NAME}. ` +
          `Ensure you have access to the repository and either 'gh' or 'git' is available.\n` +
          `Details: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Get the commit SHA
  let commitSha = "unknown";
  try {
    commitSha = execSync("git rev-parse HEAD", {
      cwd: tmpDir,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {
    // Non-critical — we can proceed without the SHA
  }

  return {
    localPath: tmpDir,
    commitSha,
    branch,
    cleanup: () => removeDirectory(tmpBase),
  };
}

/**
 * Get the latest commit SHA of the remote repo without cloning.
 * Useful for checking if an update is available.
 */
export function getRemoteHeadSha(branch = "main"): string | null {
  // Try gh first
  try {
    const result = execSync(
      `gh api repos/${REPO_OWNER}/${REPO_NAME}/commits/${branch} --jq '.sha'`,
      { encoding: "utf-8", stdio: "pipe", timeout: 15_000 }
    ).trim();
    if (result) return result;
  } catch {
    // Fall through
  }

  // Fallback: git ls-remote
  try {
    const result = execSync(
      `git ls-remote "${REPO_URL}" refs/heads/${branch}`,
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
export function getRepoInfo() {
  return {
    owner: REPO_OWNER,
    name: REPO_NAME,
    url: `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
    fullName: `${REPO_OWNER}/${REPO_NAME}`,
  };
}

// ── Commit comparison ───────────────────────────────────

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
  /** "ahead" | "behind" | "identical" | "diverged" */
  status: string;
  /** Number of commits between base and head. */
  aheadBy: number;
  /** Total commits in the comparison. */
  totalCommits: number;
  /** List of commits between base and head. */
  commits: CommitInfo[];
  /** List of files changed. */
  files: FileChange[];
  /** URL to view the comparison on GitHub. */
  htmlUrl: string;
}

/**
 * Fetch the most recent commits from the repository.
 * Useful for showing recent activity when no local installation exists.
 *
 * Uses: GET /repos/{owner}/{repo}/commits?per_page=N
 */
export function getRecentCommits(
  count = 10,
  branch = "main"
): CommitInfo[] | null {
  try {
    const raw = execSync(
      `gh api "repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${branch}&per_page=${count}"`,
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
 * Returns the diff between `baseSha` (installed) and `headSha` (latest).
 *
 * Uses: GET /repos/{owner}/{repo}/compare/{base}...{head}
 */
export function compareCommits(
  baseSha: string,
  headSha: string
): CompareResult | null {
  try {
    const raw = execSync(
      `gh api repos/${REPO_OWNER}/${REPO_NAME}/compare/${baseSha}...${headSha}`,
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
