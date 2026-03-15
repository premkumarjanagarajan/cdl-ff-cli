#!/usr/bin/env bash
#
# Fluid Flow CLI — One-line installer (macOS / Linux)
#
# Usage (requires GitHub CLI — this is a private repository):
#   gh api repos/BetssonGroup/cdl-ff-cli/contents/install.sh -H "Accept:application/vnd.github.raw" | bash
#
# Windows? Use the PowerShell installer instead:
#   gh api repos/BetssonGroup/cdl-ff-cli/contents/install.ps1 -H "Accept:application/vnd.github.raw" | iex
#
# What this script does:
#   1. Checks prerequisites (Node.js >= 20, Git, GitHub CLI)
#   2. Clones ff-cli to ~/.ff-cli (or updates if already present)
#   3. Installs npm dependencies
#   4. Builds the TypeScript source
#   5. Links the CLI globally (ff, fluidflow)
#
set -euo pipefail

# ── Colors ──────────────────────────────────────────────
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

# ── Config ──────────────────────────────────────────────
REPO_OWNER="premkumarjanagarajan"
REPO_NAME="cdl-ff-cli"
INSTALL_DIR="$HOME/.ff-cli"
PKG_DIR="$INSTALL_DIR/package"
MIN_NODE_MAJOR=20

# ── Helpers ─────────────────────────────────────────────
info()    { echo -e "  ${CYAN}▸${RESET} $1"; }
success() { echo -e "  ${GREEN}✓${RESET} $1"; }
warn()    { echo -e "  ${YELLOW}!${RESET} $1"; }
fail()    { echo -e "  ${RED}✗${RESET} $1"; exit 1; }

header() {
  echo ""
  echo -e "${BOLD}${CYAN}"
  echo "  ╭─────────────────────────────────────────╮"
  echo "  │                                         │"
  echo "  │       Fluid Flow CLI — Installer        │"
  echo "  │                                         │"
  echo "  ╰─────────────────────────────────────────╯"
  echo -e "${RESET}"
}

# ── Prerequisite checks ────────────────────────────────

check_node() {
  if ! command -v node &>/dev/null; then
    fail "Node.js is not installed. Please install Node.js >= ${MIN_NODE_MAJOR} from https://nodejs.org/"
  fi

  local node_version
  node_version=$(node --version | sed 's/^v//')
  local major
  major=$(echo "$node_version" | cut -d. -f1)

  if [ "$major" -lt "$MIN_NODE_MAJOR" ]; then
    fail "Node.js ${node_version} detected — version >= ${MIN_NODE_MAJOR}.0.0 is required. Please upgrade: https://nodejs.org/"
  fi

  success "Node.js v${node_version}"
}

check_git() {
  if ! command -v git &>/dev/null; then
    fail "Git is not installed. Please install Git: https://git-scm.com/"
  fi

  local git_version
  git_version=$(git --version | sed 's/git version //')
  success "Git ${git_version}"
}

check_npm() {
  if ! command -v npm &>/dev/null; then
    fail "npm is not installed. It should come with Node.js — try reinstalling Node.js."
  fi

  local npm_version
  npm_version=$(npm --version)
  success "npm v${npm_version}"
}

check_gh() {
  if ! command -v gh &>/dev/null; then
    fail "GitHub CLI (gh) is required for private repository access.\n  Install from: ${BOLD}https://cli.github.com/${RESET}\n  macOS: ${BOLD}brew install gh${RESET}  |  Linux: apt/dnf/snap (see link above)\n  Then run: ${BOLD}gh auth login${RESET}"
  fi

  local gh_version
  gh_version=$(gh --version | head -1 | sed 's/gh version //' | cut -d' ' -f1)
  success "GitHub CLI v${gh_version}"

  # Check if authenticated
  if gh auth status &>/dev/null; then
    success "GitHub CLI authenticated"
  else
    fail "GitHub CLI is not authenticated.\n  Run: ${BOLD}gh auth login${RESET}"
  fi

  # Verify access to the repository
  if gh repo view "${REPO_OWNER}/${REPO_NAME}" --json name &>/dev/null; then
    success "Access to ${REPO_OWNER}/${REPO_NAME} verified"
  else
    fail "Cannot access ${REPO_OWNER}/${REPO_NAME}.\n  Ensure you have been granted access to this repository."
  fi
}

# ── Install / Update ───────────────────────────────────

clone_or_update() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Existing installation found at ${BOLD}${INSTALL_DIR}${RESET}"
    info "Updating to latest version..."

    cd "$INSTALL_DIR"

    git stash --quiet 2>/dev/null || true
    gh auth setup-git 2>/dev/null || true

    git fetch origin main --quiet
    git checkout main --quiet 2>/dev/null || true
    git reset --hard origin/main --quiet

    # Migrate legacy full-clone installs to sparse checkout
    if ! git sparse-checkout list &>/dev/null 2>&1; then
      info "Migrating to sparse checkout..."
      git sparse-checkout init --cone
      git sparse-checkout set package
      git checkout main --quiet 2>/dev/null || true
    fi

    success "Updated to latest"
  else
    info "Cloning ${REPO_OWNER}/${REPO_NAME} to ${BOLD}${INSTALL_DIR}${RESET}..."

    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    git init --quiet
    gh auth setup-git 2>/dev/null || true
    git remote add origin "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"

    # Only materialize the package/ subfolder on user machines
    git sparse-checkout init --cone
    git sparse-checkout set package

    git fetch --depth=1 origin main --quiet
    git checkout main --quiet

    success "Repository cloned (sparse)"
  fi
}

install_deps() {
  info "Installing dependencies..."
  cd "$PKG_DIR"
  npm install --silent --no-fund --no-audit 2>/dev/null
  success "Dependencies installed"
}

build_project() {
  info "Building TypeScript source..."
  cd "$PKG_DIR"
  npm run build --silent 2>/dev/null
  success "Build complete"
}

link_cli() {
  info "Linking CLI globally..."
  cd "$PKG_DIR"

  npm unlink -g @fluidflow/cli 2>/dev/null || true
  npm link --silent 2>/dev/null

  success "CLI linked globally"
}

verify_install() {
  echo ""
  if command -v ff &>/dev/null; then
    local version
    version=$(ff --version 2>/dev/null || echo "unknown")
    success "${BOLD}Installation successful!${RESET} — ${version}"
  else
    # npm link might have succeeded but the bin is not in PATH yet
    local npm_bin
    npm_bin=$(npm prefix -g 2>/dev/null)/bin
    
    if [ -f "${npm_bin}/ff" ]; then
      warn "Installed, but ${BOLD}ff${RESET} is not in your PATH"
      echo ""
      info "Add this to your shell profile (${BOLD}~/.zshrc${RESET} or ${BOLD}~/.bashrc${RESET}):"
      echo ""
      echo -e "    ${DIM}export PATH=\"${npm_bin}:\$PATH\"${RESET}"
      echo ""
      info "Then reload your shell:"
      echo ""
      echo -e "    ${DIM}source ~/.zshrc${RESET}"
      echo ""
    else
      warn "Link may not have completed. Try running manually:"
      echo ""
      echo -e "    ${DIM}cd ~/.ff-cli/package && npm link${RESET}"
      echo ""
    fi
  fi
}

register_install() {
  local username email hostname_val os_info node_ver cli_ver timestamp payload

  username=$(git config user.name 2>/dev/null || echo "Unknown")
  email=$(git config user.email 2>/dev/null || echo "Unknown")
  hostname_val=$(hostname 2>/dev/null || echo "Unknown")
  os_info="$(uname -s) $(uname -m) $(uname -r)"
  node_ver=$(node --version 2>/dev/null || echo "Unknown")
  cli_ver=$(node -e "console.log(JSON.parse(require('fs').readFileSync('${PKG_DIR}/package.json','utf-8')).version)" 2>/dev/null || echo "unknown")
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  payload=$(cat <<PEOF
{
  "event_type": "installation-log",
  "client_payload": {
    "event": "CLI Install",
    "user": "${username}",
    "email": "${email}",
    "hostname": "${hostname_val}",
    "os": "${os_info}",
    "node": "${node_ver}",
    "cli_version": "${cli_ver}",
    "timestamp": "${timestamp}"
  }
}
PEOF
)

  echo "$payload" | gh api repos/${REPO_OWNER}/${REPO_NAME}/dispatches --input - 2>/dev/null || true
}

print_next_steps() {
  echo ""
  echo -e "${BOLD}${CYAN}  ── Next Steps ──────────────────────────────${RESET}"
  echo ""
  echo -e "  ${DIM}1.${RESET} Navigate to your project directory:"
  echo -e "     ${DIM}cd /path/to/your-project${RESET}"
  echo ""
  echo -e "  ${DIM}2.${RESET} Launch Fluid Flow:"
  echo -e "     ${BOLD}ff${RESET}"
  echo ""
  echo -e "  ${DIM}3.${RESET} Or install directly:"
  echo -e "     ${BOLD}ff install dev${RESET}"
  echo ""
  echo -e "  ${DIM}For help:${RESET}  ${BOLD}ff --help${RESET}"
  echo -e "  ${DIM}Docs:${RESET}      https://github.com/${REPO_OWNER}/${REPO_NAME}#readme"
  echo ""
}

# ── Main ────────────────────────────────────────────────

main() {
  header

  echo -e "  ${BOLD}Checking prerequisites...${RESET}"
  echo ""
  check_node
  check_git
  check_npm
  check_gh

  echo ""
  echo -e "  ${BOLD}Installing Fluid Flow CLI...${RESET}"
  echo ""
  clone_or_update
  install_deps
  build_project
  link_cli
  verify_install
  register_install
  print_next_steps
}

main "$@"
