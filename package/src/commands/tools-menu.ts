/**
 * Tools Menu
 *
 * Sub-menu for developer tooling utilities:
 *   - Self Update   — update the Fluid Flow CLI itself
 *   - Install Slidev — scaffold a Slidev presentation project
 *   - Back          — return to the main menu
 */

import { theme } from "../ui/theme.js";
import { promptMenu } from "../ui/menu.js";
import { isUpdateAvailable } from "./self-update.js";

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Show the Tools sub-menu and handle selected actions.
 * Returns when the user selects "Back".
 */
export async function showToolsMenu(): Promise<void> {
  let running = true;

  while (running) {
    const updateAvailable = isUpdateAvailable();

    const items = [
      {
        key: "self-update",
        label: "Self Update",
        description: updateAvailable
          ? "Update Fluid Flow CLI to the latest version (update available!)"
          : "Update Fluid Flow CLI to the latest version",
      },
      {
        key: "install-slidev",
        label: "Install Slidev",
        description: "Scaffold a Slidev presentation project (sli.dev)",
      },
      {
        key: "back",
        label: "Back",
        description: "Return to main menu",
      },
    ];

    const action = await promptMenu(items, {
      title: "Tools",
      prompt: "Select a tool",
    });

    switch (action.key) {
      case "self-update": {
        const { runSelfUpdateCLI } = await import("./self-update.js");
        await runSelfUpdateCLI();
        break;
      }

      case "install-slidev": {
        const { runInstallSlidevCLI } = await import("./install-slidev.js");
        await runInstallSlidevCLI();
        break;
      }

      case "back":
        running = false;
        break;
    }
  }
}
