import readline from "node:readline";
import path from "node:path";
import { theme } from "../ui/theme.js";
import { renderBox } from "../ui/box.js";
import { promptConfirm } from "../ui/menu.js";
import {
  setupMcp,
  analyzeAllTargets,
  MCP_SERVERS,
  type McpTarget,
  type McpSetupResult,
  type ConfigAnalysis,
} from "../installer/mcp-setup.js";
import { isDirectory } from "../installer/file-ops.js";

// ── CLI entry point ────────────────────────────────────

/**
 * Run the mcp-setup command from CLI arguments.
 * Usage: ff mcp-setup [target-dir] [--target cursor|copilot|both] [--force]
 */
export async function runMcpSetupCLI(args: string[]): Promise<void> {
  let targetDir: string | undefined;
  let target: McpTarget | undefined;
  let force = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if ((arg === "--target" || arg === "-t") && args[i + 1]) {
      const value = args[++i]!.toLowerCase();
      if (value === "cursor" || value === "copilot" || value === "both") {
        target = value;
      } else {
        console.error(
          theme.textError(
            `  Invalid target: "${value}". Use "cursor", "copilot", or "both".`
          )
        );
        process.exit(1);
      }
    } else if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--help" || arg === "-h") {
      printMcpSetupHelp();
      return;
    } else if (!arg.startsWith("-")) {
      targetDir = arg;
    }
  }

  // Resolve target directory
  targetDir = targetDir ? path.resolve(targetDir) : process.cwd();

  if (!isDirectory(targetDir)) {
    console.error(
      theme.textError(`  Target directory does not exist: ${targetDir}`)
    );
    process.exit(1);
  }

  // Prompt for target if not specified
  if (!target) {
    target = await promptMcpTarget();
  }

  // Analyze existing configs and confirm before writing
  const confirmed = await analyzeAndConfirm(targetDir, target, force);
  if (!confirmed) return;

  // Execute setup
  try {
    const result = await setupMcp({ target, targetDir, force });
    printMcpSetupSuccess(result);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(
        `  MCP setup failed: ${err instanceof Error ? err.message : String(err)}`
      )
    );
    console.log();
    process.exit(1);
  }
}

// ── REPL command handler ────────────────────────────────

/**
 * Handle the mcp-setup command from within the REPL.
 */
export async function handleMcpSetupREPL(
  args: string,
  ctx: { cwd: string }
): Promise<void> {
  const parts = args.trim().split(/\s+/).filter(Boolean);

  let targetDir = ctx.cwd;
  let target: McpTarget | undefined;
  let force = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (part === "--cursor" || part === "cursor") {
      target = "cursor";
    } else if (part === "--copilot" || part === "copilot") {
      target = "copilot";
    } else if (part === "--both" || part === "both") {
      target = "both";
    } else if (part === "--force" || part === "-f") {
      force = true;
    } else if (part && !part.startsWith("-")) {
      targetDir = path.resolve(ctx.cwd, part);
    }
  }

  if (!isDirectory(targetDir)) {
    console.log();
    console.log(
      theme.textError(`  Target directory does not exist: ${targetDir}`)
    );
    console.log();
    return;
  }

  // Prompt for target if not specified
  if (!target) {
    target = await promptMcpTarget();
  }

  // Analyze existing configs and confirm before writing
  const confirmed = await analyzeAndConfirm(targetDir, target, force);
  if (!confirmed) return;

  try {
    const result = await setupMcp({ target, targetDir, force });
    printMcpSetupSuccess(result);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(
        `  MCP setup failed: ${err instanceof Error ? err.message : String(err)}`
      )
    );
    console.log();
  }
}

// ── Shared: post-install MCP setup ──────────────────────

/**
 * Offer MCP setup after a successful install.
 * Called from install command handlers.
 */
export async function offerMcpSetupAfterInstall(
  targetDir: string
): Promise<void> {
  console.log(
    theme.brandBright("  ─── MCP Server Configuration ───")
  );
  console.log();
  console.log(
    theme.text(
      "  Would you also like to configure MCP servers for this project?"
    )
  );
  console.log(
    theme.textSecondary(
      "  This sets up Atlassian, GitHub, filesystem, and other MCP tools."
    )
  );
  console.log();

  const wantsMcp = await promptConfirm("Configure MCP servers?");

  if (!wantsMcp) {
    console.log();
    console.log(
      theme.hint("  You can configure MCP servers later with: ff mcp-setup")
    );
    console.log();
    return;
  }

  // Ask which platform
  const target = await promptMcpTarget();

  // Analyze and confirm
  const confirmed = await analyzeAndConfirm(targetDir, target, false);
  if (!confirmed) return;

  try {
    const result = await setupMcp({ target, targetDir });
    printMcpSetupSuccess(result);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(
        `  MCP setup failed: ${err instanceof Error ? err.message : String(err)}`
      )
    );
    console.log(
      theme.hint("  You can retry with: ff mcp-setup")
    );
    console.log();
  }
}

// ── Analysis & Confirmation ─────────────────────────────

/**
 * Analyze existing MCP configs, display the analysis to the user,
 * and ask for confirmation before writing.
 *
 * Returns true if the user confirmed (or no confirmation needed),
 * false if the user declined or everything is already configured.
 */
async function analyzeAndConfirm(
  targetDir: string,
  target: McpTarget,
  force: boolean
): Promise<boolean> {
  const analyses = analyzeAllTargets(targetDir, target);

  // Check if there's anything to do
  const allFullyConfigured = analyses.every(
    (a) => a.newServerNames.length === 0
  );

  if (allFullyConfigured && !force) {
    console.log();
    console.log(
      `  ${theme.textSuccess("✓")} ${theme.text("All MCP servers are already configured.")}`
    );
    for (const a of analyses) {
      console.log(
        `    ${theme.path(a.relativePath)}: ${theme.textSecondary(
          `${a.alreadyConfiguredNames.length} servers`
        )}`
      );
    }
    console.log();
    console.log(
      theme.hint("  Use --force to overwrite existing server entries.")
    );
    console.log();
    return false;
  }

  // Display analysis for each platform
  let needsConfirmation = false;

  for (const analysis of analyses) {
    displayConfigAnalysis(analysis, force);

    if (analysis.hasExistingConfig && analysis.newServerNames.length > 0) {
      needsConfirmation = true;
    }
  }

  // If existing configs were found with servers, ask for confirmation
  if (needsConfirmation && !force) {
    console.log();
    const proceed = await promptConfirm(
      "Add the new entries shown above?"
    );
    if (!proceed) {
      console.log();
      console.log(theme.textSecondary("  MCP setup cancelled."));
      console.log();
      return false;
    }
  }

  return true;
}

/**
 * Display the analysis of an existing MCP config file.
 * Shows what exists, what's new, and the JSON entries to add.
 */
function displayConfigAnalysis(
  analysis: ConfigAnalysis,
  force: boolean
): void {
  const platformLabel =
    analysis.platform === "cursor"
      ? "Cursor"
      : "VS Code / Copilot";

  console.log();

  if (!analysis.hasExistingConfig) {
    // No existing config — straightforward
    console.log(
      `  ${theme.brandBright("→")} ${theme.text(`${platformLabel}:`)} ${theme.path(analysis.relativePath)}`
    );
    console.log(
      `    ${theme.textSecondary("No existing config — will create fresh with")} ${theme.text(
        String(Object.keys(MCP_SERVERS).length)
      )} ${theme.textSecondary("servers")}`
    );
    return;
  }

  // Existing config found — show details
  console.log(
    `  ${theme.textWarning("⚠")} ${theme.text(
      `Existing MCP configuration found for ${platformLabel}`
    )}`
  );
  console.log(
    `    ${theme.textSecondary("File:")} ${theme.path(analysis.relativePath)}`
  );
  console.log(
    `    ${theme.textSecondary("Existing servers:")} ${theme.text(
      analysis.existingServerNames.join(", ") || "none"
    )}`
  );

  if (analysis.userCustomServers.length > 0) {
    console.log(
      `    ${theme.textSecondary("User-defined (preserved):")} ${theme.text(
        analysis.userCustomServers.join(", ")
      )}`
    );
  }

  if (analysis.alreadyConfiguredNames.length > 0) {
    console.log(
      `    ${theme.textSecondary("Already configured:")} ${theme.textSuccess(
        analysis.alreadyConfiguredNames.join(", ")
      )}${force ? theme.textWarning(" (will be overwritten with --force)") : ""}`
    );
  }

  if (analysis.newServerNames.length > 0) {
    console.log(
      `    ${theme.textSecondary("New servers to add:")} ${theme.highlight(
        analysis.newServerNames.join(", ")
      )}`
    );

    // Show the JSON entries that will be added
    console.log();
    console.log(
      `    ${theme.textSecondary(
        `Entries to add to ${analysis.relativePath}:`
      )}`
    );
    console.log();

    // Indent each line of the JSON for readability
    const jsonLines = analysis.newEntriesJson.split("\n");
    for (const line of jsonLines) {
      console.log(`      ${theme.textMuted(line)}`);
    }
  } else if (!force) {
    console.log(
      `    ${theme.textSuccess("✓")} ${theme.textSecondary("All servers already configured")}`
    );
  }
}

// ── Interactive prompts ─────────────────────────────────

/**
 * Prompt the user to choose a target platform for MCP configuration.
 */
async function promptMcpTarget(): Promise<McpTarget> {
  console.log();
  console.log(theme.brandBold("  Choose your target platform:"));
  console.log();
  console.log(
    `  ${theme.highlight("1")}  ${theme.text("Cursor")}               ${theme.textSecondary("— .cursor/mcp.json")}`
  );
  console.log(
    `  ${theme.highlight("2")}  ${theme.text("VS Code / Copilot")}    ${theme.textSecondary("— .vscode/mcp.json + settings")}`
  );
  console.log(
    `  ${theme.highlight("3")}  ${theme.text("Both")}                 ${theme.textSecondary("— configure both platforms")}`
  );
  console.log();

  return new Promise<McpTarget>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const ask = () => {
      rl.question(
        theme.prompt("  Select (1, 2, or 3): ") + " ",
        (answer) => {
          const trimmed = answer.trim().toLowerCase();
          if (trimmed === "1" || trimmed === "cursor") {
            rl.close();
            resolve("cursor");
          } else if (
            trimmed === "2" ||
            trimmed === "copilot" ||
            trimmed === "vscode"
          ) {
            rl.close();
            resolve("copilot");
          } else if (trimmed === "3" || trimmed === "both") {
            rl.close();
            resolve("both");
          } else {
            console.log(
              theme.textWarning(
                "  Please enter 1 (Cursor), 2 (VS Code / Copilot), or 3 (Both)."
              )
            );
            ask();
          }
        }
      );
    };

    ask();
  });
}

// ── Output helpers ──────────────────────────────────────

function formatTarget(target: McpTarget): string {
  switch (target) {
    case "cursor":
      return "Cursor";
    case "copilot":
      return "VS Code / GitHub Copilot";
    case "both":
      return "Both (Cursor + VS Code / Copilot)";
  }
}

function printMcpSetupSuccess(result: McpSetupResult): void {
  console.log();
  console.log(
    `  ${theme.textSuccess("✓")} ${theme.brandBold("MCP servers configured successfully!")}`
  );
  console.log();
  console.log(
    `  ${theme.textSecondary("Platform:")}    ${theme.text(formatTarget(result.target))}`
  );
  console.log(
    `  ${theme.textSecondary("Added:")}       ${theme.text(String(result.serversAdded))} servers`
  );

  if (result.serversSkipped > 0) {
    console.log(
      `  ${theme.textSecondary("Skipped:")}     ${theme.text(
        String(result.serversSkipped)
      )} (already configured)`
    );
  }

  console.log(
    `  ${theme.textSecondary("Files:")}       ${theme.text(result.filesWritten.join(", "))}`
  );

  if (result.prerequisitesInstalled.length > 0) {
    console.log();
    console.log(
      `  ${theme.textSuccess("✓")} Auto-installed: ${result.prerequisitesInstalled.join(", ")}`
    );
  }

  if (result.prerequisitesMissing.length > 0) {
    console.log();
    console.log(
      theme.textWarning(
        `  ⚠ Missing prerequisites: ${result.prerequisitesMissing.join(", ")}`
      )
    );
    console.log(
      theme.textSecondary(
        "    Some MCP servers may not work until these are installed."
      )
    );
  }

  console.log();
  console.log(theme.hint("  Next steps:"));

  if (result.target === "cursor" || result.target === "both") {
    console.log(
      theme.textSecondary(
        "  • Cursor: Restart Cursor or reload the window to activate MCP servers"
      )
    );
  }

  if (result.target === "copilot" || result.target === "both") {
    console.log(
      theme.textSecondary(
        "  • VS Code: MCP servers auto-start when detected. Use the MCP panel to manage them"
      )
    );
  }

  console.log(
    theme.textSecondary(
      "  • Set GITHUB_PERSONAL_ACCESS_TOKEN in your environment for the GitHub MCP server"
    )
  );
  console.log(
    theme.textSecondary(
      "  • The web-search server is disabled by default — edit the config to enable it"
    )
  );
  console.log();
}

function printMcpSetupHelp(): void {
  console.log();
  console.log(
    theme.brandBold("  ff mcp-setup") +
      theme.textSecondary(
        " — Configure MCP servers for AI coding assistants"
      )
  );
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary("    ff mcp-setup [target-dir] [options]"));
  console.log();
  console.log(theme.text("  Options:"));
  console.log(
    `    ${theme.command("--target, -t")} ${theme.textSecondary("<cursor|copilot|both>")}  Target platform`
  );
  console.log(
    `    ${theme.command("--force, -f")}                           ${theme.textSecondary("Overwrite existing server entries")}`
  );
  console.log(
    `    ${theme.command("--help, -h")}                            ${theme.textSecondary("Show this help")}`
  );
  console.log();
  console.log(theme.text("  Examples:"));
  console.log(
    theme.textSecondary(
      "    ff mcp-setup                           # Interactive setup in current directory"
    )
  );
  console.log(
    theme.textSecondary(
      "    ff mcp-setup --target cursor            # Setup for Cursor only"
    )
  );
  console.log(
    theme.textSecondary(
      "    ff mcp-setup --target copilot           # Setup for VS Code / GitHub Copilot"
    )
  );
  console.log(
    theme.textSecondary(
      "    ff mcp-setup --target both              # Setup for both platforms"
    )
  );
  console.log(
    theme.textSecondary(
      "    ff mcp-setup /path/to/repo -t both      # Setup in a specific directory"
    )
  );
  console.log();
  console.log(theme.text("  MCP servers included:"));

  for (const [name, def] of Object.entries(MCP_SERVERS)) {
    const status = def.disabled
      ? theme.textMuted("disabled")
      : theme.textSuccess("enabled");
    const runtime = def.command === "uvx" ? "Python/uv" : "Node.js";
    console.log(
      `    ${theme.command(name.padEnd(24))} ${status}   ${theme.textSecondary(runtime)}`
    );
  }

  console.log();
  console.log(theme.text("  Prerequisites:"));
  console.log(
    theme.textSecondary(
      "    Node.js / npx    Required for most MCP servers"
    )
  );
  console.log(
    theme.textSecondary(
      "    uv / uvx         Required for Python-based MCP servers (aws-document-loader)"
    )
  );
  console.log(
    theme.textSecondary(
      "    Missing prerequisites are automatically installed when possible."
    )
  );
  console.log();
}
