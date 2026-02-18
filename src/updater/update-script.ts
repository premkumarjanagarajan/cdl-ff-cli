/**
 * Update Script Generator
 *
 * Generates self-contained shell scripts (bash / PowerShell) that perform
 * the actual CLI update outside of the Node.js process. This avoids the
 * "updating yourself while running" problem and includes automatic rollback
 * on failure.
 */

// ── Value escaping ───────────────────────────────────────────────────────────

function escapeBash(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
}

function escapePowerShell(value: string): string {
  return value.replace(/`/g, "``").replace(/\$/g, "`$").replace(/"/g, '`"');
}

// ── Bash (macOS / Linux) ─────────────────────────────────────────────────────

export function generateBashUpdateScript(
  installDir: string,
  rollbackSha: string,
  branch = "main",
): string {
  const safeDir = escapeBash(installDir);
  const safeSha = escapeBash(rollbackSha);
  const safeBranch = escapeBash(branch);

  return `#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${safeDir}"
ROLLBACK_SHA="${safeSha}"
BRANCH="${safeBranch}"
SCRIPT_PATH="\$0"

# ── Colors ──────────────────────────────────────────────
BOLD='\\033[1m'
DIM='\\033[2m'
GREEN='\\033[0;32m'
YELLOW='\\033[0;33m'
RED='\\033[0;31m'
CYAN='\\033[0;36m'
RESET='\\033[0m'

info()    { echo -e "  \${CYAN}▸\${RESET} \$1"; }
success() { echo -e "  \${GREEN}✓\${RESET} \$1"; }
warn()    { echo -e "  \${YELLOW}!\${RESET} \$1"; }
fail()    { echo -e "  \${RED}✗\${RESET} \$1"; }

rollback() {
  echo ""
  warn "Update failed — rolling back to previous version..."
  cd "\$INSTALL_DIR"
  git reset --hard "\$ROLLBACK_SHA" --quiet 2>/dev/null || true
  npm install --silent --no-fund --no-audit 2>/dev/null || true
  npm run build --silent 2>/dev/null || true
  if command -v ff &>/dev/null && ff --version &>/dev/null; then
    success "Rollback successful — CLI restored to previous version."
  else
    fail "Rollback may have failed. Try re-installing:"
    echo -e "    \${DIM}cd \$INSTALL_DIR && git checkout \$BRANCH && npm install && npm run build && npm link\${RESET}"
  fi
  cleanup
  exit 1
}

cleanup() {
  rm -f "\$SCRIPT_PATH" 2>/dev/null || true
}

trap rollback ERR

echo ""
echo -e "\${BOLD}\${CYAN}  ── Fluid Flow CLI — Self Update ──\${RESET}"
echo ""

cd "\$INSTALL_DIR"

info "Fetching latest from GitHub..."
gh auth setup-git 2>/dev/null || true
git fetch origin "\$BRANCH" --quiet
git reset --hard "origin/\$BRANCH" --quiet
success "Source updated"

info "Installing dependencies..."
npm install --silent --no-fund --no-audit 2>/dev/null
success "Dependencies installed"

info "Building TypeScript source..."
npm run build --silent 2>/dev/null
success "Build complete"

info "Re-linking CLI..."
npm unlink -g @fluidflow/cli 2>/dev/null || true
npm link --silent 2>/dev/null
success "CLI linked globally"

echo ""
if command -v ff &>/dev/null; then
  NEW_VERSION=\$(ff --version 2>/dev/null || echo "unknown")
  success "\${BOLD}Update successful!\${RESET} — \${NEW_VERSION}"
else
  warn "Update completed but 'ff' is not in PATH. Try opening a new terminal."
fi
echo ""

cleanup
`;
}

// ── PowerShell (Windows) ─────────────────────────────────────────────────────

export function generatePowerShellUpdateScript(
  installDir: string,
  rollbackSha: string,
  branch = "main",
): string {
  const safeDir = escapePowerShell(installDir);
  const safeSha = escapePowerShell(rollbackSha);
  const safeBranch = escapePowerShell(branch);

  return `#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$InstallDir = "${safeDir}"
$RollbackSha = "${safeSha}"
$Branch = "${safeBranch}"
$ScriptPath = $MyInvocation.MyCommand.Source

function Write-Info($msg)    { Write-Host "  > $msg" -ForegroundColor Cyan }
function Write-Ok($msg)      { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  ! $msg" -ForegroundColor Yellow }
function Write-Fail($msg)    { Write-Host "  ✗ $msg" -ForegroundColor Red }

function Invoke-Rollback {
    Write-Host ""
    Write-Warn "Update failed — rolling back to previous version..."
    Set-Location $InstallDir
    git reset --hard $RollbackSha --quiet 2>$null
    npm install --silent --no-fund --no-audit 2>$null
    npm run build --silent 2>$null
    try {
        $null = ff --version 2>$null
        Write-Ok "Rollback successful — CLI restored to previous version."
    } catch {
        Write-Fail "Rollback may have failed. Try re-installing manually."
    }
    Remove-Item -Path $ScriptPath -Force -ErrorAction SilentlyContinue
    exit 1
}

try {
    Write-Host ""
    Write-Host "  -- Fluid Flow CLI — Self Update --" -ForegroundColor Cyan
    Write-Host ""

    Set-Location $InstallDir

    Write-Info "Fetching latest from GitHub..."
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        try { gh auth setup-git 2>$null } catch { }
    }
    git fetch origin $Branch --quiet
    git reset --hard ("origin/" + $Branch) --quiet
    Write-Ok "Source updated"

    Write-Info "Installing dependencies..."
    npm install --silent --no-fund --no-audit 2>$null
    Write-Ok "Dependencies installed"

    Write-Info "Building TypeScript source..."
    npm run build --silent 2>$null
    Write-Ok "Build complete"

    Write-Info "Re-linking CLI..."
    npm unlink -g @fluidflow/cli 2>$null
    npm link --silent 2>$null
    Write-Ok "CLI linked globally"

    Write-Host ""
    try {
        $NewVersion = ff --version 2>$null
        Write-Ok "Update successful! — $NewVersion"
    } catch {
        Write-Warn "Update completed but 'ff' is not in PATH. Try opening a new terminal."
    }
    Write-Host ""

} catch {
    Invoke-Rollback
}

Remove-Item -Path $ScriptPath -Force -ErrorAction SilentlyContinue
`;
}
