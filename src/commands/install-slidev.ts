/**
 * Install Slidev Command
 *
 * Scaffolds a new Slidev presentation project using the user's preferred
 * package manager. Slidev is a web-based slides tool designed for developers,
 * allowing presentations to be written in Markdown + Vue.
 *
 * https://sli.dev
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { theme } from "../ui/theme.js";
import { promptMenu, promptDirectory, promptConfirm } from "../ui/menu.js";
import { renderBox } from "../ui/box.js";
import { shortenPath } from "../utils/system.js";

// ── Package manager definitions ──────────────────────────────────────────────

interface PackageManager {
  id: string;
  label: string;
  description: string;
  command: string;
  args: string[];
}

const PACKAGE_MANAGERS: PackageManager[] = [
  {
    id: "npm",
    label: "npm",
    description: "Node Package Manager (bundled with Node.js)",
    command: "npm",
    args: ["init", "slidev@latest"],
  },
  {
    id: "pnpm",
    label: "pnpm",
    description: "Fast, disk space-efficient package manager (recommended)",
    command: "pnpm",
    args: ["create", "slidev"],
  },
  {
    id: "yarn",
    label: "yarn",
    description: "Yarn Classic / Berry",
    command: "yarn",
    args: ["create", "slidev"],
  },
  {
    id: "bun",
    label: "bun",
    description: "Fast all-in-one JavaScript runtime",
    command: "bun",
    args: ["create", "slidev"],
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

export async function runInstallSlidevCLI(): Promise<void> {
  console.log();
  console.log(
    renderBox(
      [
        "",
        theme.brandBold("  Slidev — Presentation Slides for Developers"),
        "",
        `  ${theme.textSecondary("Write slides in")}  ${theme.highlight("Markdown + Vue")}`,
        `  ${theme.textSecondary("Powered by")}      ${theme.highlight("Vite · Vue 3 · UnoCSS")}`,
        `  ${theme.textSecondary("Docs:")}           ${theme.path("https://sli.dev")}`,
        "",
        `  ${theme.hint("Interactive demos, live code, animations, PDF export")}`,
        `  ${theme.hint("and more — all from a single .md file.")}`,
        "",
      ],
      { title: "Slidev", minWidth: 58 }
    )
  );
  console.log();

  // Step 1: Choose package manager
  const pmItems = PACKAGE_MANAGERS.map((pm) => ({
    key: pm.id,
    label: pm.label,
    description: pm.description,
  }));

  const selectedPm = await promptMenu(pmItems, {
    title: "Package Manager",
    prompt: "Select a package manager",
  });

  const pm = PACKAGE_MANAGERS.find((p) => p.id === selectedPm.key)!;

  // Step 2: Choose target directory
  const cwd = process.cwd();
  console.log();
  const targetInput = await promptDirectory(shortenPath(cwd));
  const targetDir =
    targetInput === shortenPath(cwd) ? cwd : path.resolve(targetInput);

  // Step 3: Confirm
  console.log();
  console.log(
    renderBox(
      [
        "",
        theme.brandBold("  Install Plan"),
        "",
        `  ${theme.textSecondary("Package manager:")} ${theme.text(pm.label)}`,
        `  ${theme.textSecondary("Command:")}         ${theme.command(`${pm.command} ${pm.args.join(" ")}`)}`,
        `  ${theme.textSecondary("Working dir:")}     ${theme.path(shortenPath(targetDir))}`,
        "",
        `  ${theme.hint("Slidev will guide you through the project setup interactively.")}`,
        "",
      ],
      { title: "Slidev Setup", minWidth: 58 }
    )
  );
  console.log();

  const confirmed = await promptConfirm("Proceed with Slidev installation?");
  if (!confirmed) {
    console.log();
    console.log(theme.textSecondary("  Installation cancelled."));
    console.log();
    return;
  }

  // Step 4: Run
  console.log();
  console.log(
    `  ${theme.brandBright("→")} ${theme.text(`Running ${theme.command(`${pm.command} ${pm.args.join(" ")}`)}`)}...`
  );
  console.log(
    theme.textMuted(`  in ${shortenPath(targetDir)}`)
  );
  console.log();

  const exitCode = await spawnInteractive(pm.command, pm.args, targetDir);

  console.log();
  if (exitCode === 0) {
    printSuccess(pm);
  } else {
    console.log(
      theme.textError(`  Slidev setup exited with code ${exitCode}.`)
    );
    console.log(
      theme.hint("  Check the output above for details.")
    );
    console.log();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function spawnInteractive(
  command: string,
  args: string[],
  cwd: string
): Promise<number> {
  return new Promise<number>((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", (err) => {
      console.log();
      console.error(
        theme.textError(`  Failed to run ${command}: ${err.message}`)
      );
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        console.error(
          theme.hint(
            `  Make sure ${command} is installed and available in your PATH.`
          )
        );
      }
      resolve(1);
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

function printSuccess(pm: PackageManager): void {
  console.log(
    `  ${theme.textSuccess("✓")} ${theme.brandBold("Slidev project created successfully!")}`
  );
  console.log();
  console.log(theme.hint("  Next steps:"));
  console.log(
    theme.textSecondary(`  1. ${theme.command("cd")} into your new project folder`)
  );
  console.log(
    theme.textSecondary(
      `  2. Run ${theme.command(`${pm.command === "npm" ? "npm run" : pm.command} dev"${pm.command === "bun" ? "" : ""}`)} to start the dev server`
    )
  );
  console.log(
    theme.textSecondary(
      `  3. Edit ${theme.path("slides.md")} to write your presentation`
    )
  );
  console.log(
    theme.textSecondary(
      `  4. Visit ${theme.path("http://localhost:3030")} in your browser`
    )
  );
  console.log();
  console.log(
    theme.hint(`  Docs & themes: ${theme.path("https://sli.dev")}`)
  );
  console.log();
}
