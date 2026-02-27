/**
 * Installation Registration Module
 *
 * Creates a GitHub issue in BetssonGroup/cdl-ff-cli for each install or
 * update event (CLI install, CLI self-update, workflow install, workflow
 * update). Uses the `gh` CLI which is already a prerequisite.
 *
 * All functions are fire-and-forget — registration failure never blocks
 * the actual operation.
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

const REGISTRATION_REPO = "BetssonGroup/cdl-ff-cli";

const LABEL_SELF_INSTALL = "log-self-install";
const LABEL_SELF_UPDATE = "log-self-update";
const LABEL_INSTALL = "log-install";
const LABEL_UPDATE = "log-update";

// -- Public API ---------------------------------------------------------------

export function registerCliInstall(): void {
  try {
    const info = collectBaseInfo();
    const title = `[Log] CLI Install — ${info.userName}`;
    const body = buildMarkdownTable([
      ["Event", "CLI Install"],
      ["User", info.userName],
      ["Email", info.email],
      ["Hostname", info.hostname],
      ["OS", info.os],
      ["Node.js", process.version],
      ["CLI Version", info.cliVersion],
      ["Timestamp", info.timestamp],
    ]);
    createRegistrationIssue(title, body, LABEL_SELF_INSTALL);
  } catch {
    // Silent — never block the install
  }
}

export function registerCliSelfUpdate(fromSha: string, toSha: string): void {
  try {
    const info = collectBaseInfo();
    const title = `[Log] CLI Update — ${info.userName}`;
    const body = buildMarkdownTable([
      ["Event", "CLI Self-Update"],
      ["User", info.userName],
      ["Email", info.email],
      ["Hostname", info.hostname],
      ["OS", info.os],
      ["Node.js", process.version],
      ["CLI Version", info.cliVersion],
      ["Previous SHA", fromSha.slice(0, 8)],
      ["New SHA", toSha.slice(0, 8)],
      ["Timestamp", info.timestamp],
    ]);
    createRegistrationIssue(title, body, LABEL_SELF_UPDATE);
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
    const folderName = path.basename(targetDir);
    const projectRepo = getTargetRepoRemote(targetDir) ?? "N/A";
    const title = `[Log] Workflow Install: ${workflowId} — ${info.userName}`;
    const body = buildMarkdownTable([
      ["Event", "Workflow Install"],
      ["Workflow", `${workflowId} (${workflowName})`],
      ["User", info.userName],
      ["Email", info.email],
      ["Hostname", info.hostname],
      ["OS", info.os],
      ["Node.js", process.version],
      ["CLI Version", info.cliVersion],
      ["Folder", folderName],
      ["Project Path", shortenPath(targetDir)],
      ["Project Repository", projectRepo],
      ["Commit SHA", commitSha.slice(0, 8)],
      ["Timestamp", info.timestamp],
    ]);
    createRegistrationIssue(title, body, LABEL_INSTALL);
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
    const folderName = path.basename(targetDir);
    const projectRepo = getTargetRepoRemote(targetDir) ?? "N/A";
    const title = `[Log] Workflow Update: ${workflowId} — ${info.userName}`;
    const body = buildMarkdownTable([
      ["Event", "Workflow Update"],
      ["Workflow", `${workflowId} (${workflowName})`],
      ["User", info.userName],
      ["Email", info.email],
      ["Hostname", info.hostname],
      ["OS", info.os],
      ["Node.js", process.version],
      ["CLI Version", info.cliVersion],
      ["Folder", folderName],
      ["Project Path", shortenPath(targetDir)],
      ["Project Repository", projectRepo],
      ["Previous SHA", fromSha.slice(0, 8)],
      ["New SHA", toSha.slice(0, 8)],
      ["Timestamp", info.timestamp],
    ]);
    createRegistrationIssue(title, body, LABEL_UPDATE);
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

function buildMarkdownTable(rows: [string, string][]): string {
  const lines = ["| Field | Value |", "|-------|-------|"];
  for (const [field, value] of rows) {
    lines.push(`| **${field}** | ${value} |`);
  }
  return lines.join("\n");
}

function createRegistrationIssue(title: string, body: string, label: string): void {
  const escapedTitle = title.replace(/"/g, '\\"');
  const escapedBody = body.replace(/"/g, '\\"');
  execSync(
    `gh issue create --repo "${REGISTRATION_REPO}" --label "${label}" --title "${escapedTitle}" --body "${escapedBody}"`,
    { encoding: "utf-8", stdio: "pipe", timeout: 30_000 },
  );
}
