/**
 * Installation Log Module
 *
 * Fires a GitHub repository_dispatch event for each install or update
 * event. A GitHub Action receives the payload and appends a row to
 * the repo wiki's Installation Log page.
 *
 * Uses the `gh` CLI which is already a prerequisite.
 * All functions are fire-and-forget — failures never block the operation.
 */

import path from "node:path";
import { execSync } from "node:child_process";
import {
  getGitUserName,
  getGitEmail,
  getHostname,
  getOSInfo,
  getVersion,
  getTargetRepoRemote,
  shortenPath,
} from "../utils/system.js";

const DISPATCH_REPO = "premkumarjanagarajan/cdl-ff-cli";
const EVENT_TYPE = "installation-log";

// -- Public API ---------------------------------------------------------------

export function registerCliInstall(): void {
  try {
    const info = collectBaseInfo();
    fireDispatch({
      event: "CLI Install",
      user: info.userName,
      email: info.email,
      hostname: info.hostname,
      os: info.os,
      node: process.version,
      cli_version: info.cliVersion,
      timestamp: info.timestamp,
    });
  } catch {
    // Silent
  }
}

export function registerCliSelfUpdate(fromSha: string, toSha: string): void {
  try {
    const info = collectBaseInfo();
    fireDispatch({
      event: "CLI Self-Update",
      user: info.userName,
      email: info.email,
      hostname: info.hostname,
      os: info.os,
      node: process.version,
      cli_version: info.cliVersion,
      from_sha: fromSha.slice(0, 8),
      to_sha: toSha.slice(0, 8),
      timestamp: info.timestamp,
    });
  } catch {
    // Silent
  }
}

export function registerWorkflowInstall(
  workflowId: string,
  workflowName: string,
  targetDir: string,
  commitSha: string,
): void {
  try {
    const info = collectBaseInfo();
    fireDispatch({
      event: "Workflow Install",
      workflow: `${workflowId} (${workflowName})`,
      user: info.userName,
      email: info.email,
      hostname: info.hostname,
      os: info.os,
      node: process.version,
      cli_version: info.cliVersion,
      folder: path.basename(targetDir),
      project_path: shortenPath(targetDir),
      project_repo: getTargetRepoRemote(targetDir) ?? "N/A",
      commit_sha: commitSha.slice(0, 8),
      timestamp: info.timestamp,
    });
  } catch {
    // Silent
  }
}

export function registerWorkflowUpdate(
  workflowId: string,
  workflowName: string,
  targetDir: string,
  fromSha: string,
  toSha: string,
): void {
  try {
    const info = collectBaseInfo();
    fireDispatch({
      event: "Workflow Update",
      workflow: `${workflowId} (${workflowName})`,
      user: info.userName,
      email: info.email,
      hostname: info.hostname,
      os: info.os,
      node: process.version,
      cli_version: info.cliVersion,
      folder: path.basename(targetDir),
      project_path: shortenPath(targetDir),
      project_repo: getTargetRepoRemote(targetDir) ?? "N/A",
      from_sha: fromSha.slice(0, 8),
      to_sha: toSha.slice(0, 8),
      timestamp: info.timestamp,
    });
  } catch {
    // Silent
  }
}

// -- Internal -----------------------------------------------------------------

interface BaseInfo {
  userName: string;
  email: string;
  hostname: string;
  os: string;
  cliVersion: string;
  timestamp: string;
}

function collectBaseInfo(): BaseInfo {
  return {
    userName: getGitUserName() ?? "Unknown",
    email: getGitEmail() ?? "Unknown",
    hostname: getHostname(),
    os: getOSInfo(),
    cliVersion: getVersion(),
    timestamp: new Date().toISOString(),
  };
}

function fireDispatch(payload: Record<string, string>): void {
  const json = JSON.stringify({ event_type: EVENT_TYPE, client_payload: payload });
  execSync(
    `gh api repos/${DISPATCH_REPO}/dispatches --input - <<< '${json.replace(/'/g, "'\\''")}'`,
    { encoding: "utf-8", stdio: "pipe", timeout: 15_000, shell: "/bin/bash" },
  );
}
