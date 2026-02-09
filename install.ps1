#Requires -Version 5.1
<#
.SYNOPSIS
    Fluid Flow CLI — One-line installer for Windows.

.DESCRIPTION
    Downloads and installs the Fluid Flow CLI (ff) on Windows.
    Checks prerequisites, clones the repo, builds, and links globally.

.EXAMPLE
    # Run directly from GitHub:
    irm https://raw.githubusercontent.com/BetssonGroup/cdl-ff-cli/main/install.ps1 | iex

    # Or download and run:
    .\install.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Config ──────────────────────────────────────────────
$RepoUrl      = "https://github.com/BetssonGroup/cdl-ff-cli.git"
$InstallDir   = Join-Path $env:USERPROFILE ".ff-cli"
$MinNodeMajor = 20

# ── Helpers ─────────────────────────────────────────────

function Write-Header {
    Write-Host ""
    Write-Host "  +-------------------------------------------+" -ForegroundColor Cyan
    Write-Host "  |                                           |" -ForegroundColor Cyan
    Write-Host "  |       Fluid Flow CLI — Installer          |" -ForegroundColor Cyan
    Write-Host "  |                                           |" -ForegroundColor Cyan
    Write-Host "  +-------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Info    { param([string]$Msg) Write-Host "  > $Msg" -ForegroundColor Cyan }
function Write-Success { param([string]$Msg) Write-Host "  [OK] $Msg" -ForegroundColor Green }
function Write-Warn    { param([string]$Msg) Write-Host "  [!] $Msg" -ForegroundColor Yellow }
function Write-Fail    { param([string]$Msg) Write-Host "  [X] $Msg" -ForegroundColor Red; exit 1 }

# ── Prerequisite Checks ────────────────────────────────

function Test-Node {
    $nodePath = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodePath) {
        Write-Fail "Node.js is not installed. Please install Node.js >= $MinNodeMajor from https://nodejs.org/"
    }

    $nodeVersion = (node --version) -replace '^v', ''
    $major = [int]($nodeVersion -split '\.')[0]

    if ($major -lt $MinNodeMajor) {
        Write-Fail "Node.js $nodeVersion detected — version >= $MinNodeMajor.0.0 is required. Please upgrade: https://nodejs.org/"
    }

    Write-Success "Node.js v$nodeVersion"
}

function Test-Git {
    $gitPath = Get-Command git -ErrorAction SilentlyContinue
    if (-not $gitPath) {
        Write-Fail "Git is not installed. Please install Git: https://git-scm.com/"
    }

    $gitVersion = (git --version) -replace 'git version ', ''
    Write-Success "Git $gitVersion"
}

function Test-Npm {
    $npmPath = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npmPath) {
        Write-Fail "npm is not installed. It should come with Node.js — try reinstalling Node.js."
    }

    $npmVersion = npm --version
    Write-Success "npm v$npmVersion"
}

function Test-Gh {
    $ghPath = Get-Command gh -ErrorAction SilentlyContinue
    if ($ghPath) {
        try {
            $ghVersionRaw = (gh --version | Select-Object -First 1) -replace 'gh version ', ''
            $ghVersion = ($ghVersionRaw -split ' ')[0]
            Write-Success "GitHub CLI v$ghVersion"
        } catch {
            Write-Success "GitHub CLI installed"
        }

        # Check authentication
        try {
            gh auth status 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "GitHub CLI authenticated"
            } else {
                Write-Warn "GitHub CLI installed but not authenticated"
                Write-Warn "Run 'gh auth login' to authenticate (recommended for private repos)"
            }
        } catch {
            Write-Warn "GitHub CLI installed but not authenticated"
            Write-Warn "Run 'gh auth login' to authenticate (recommended for private repos)"
        }
    } else {
        Write-Warn "GitHub CLI (gh) not found — optional but recommended"
        Write-Info  "Install with: winget install --id GitHub.cli"
        Write-Info  "Then run: gh auth login"
    }
}

# ── Install / Update ───────────────────────────────────

function Install-OrUpdate {
    if (Test-Path $InstallDir) {
        Write-Info "Existing installation found at $InstallDir"
        Write-Info "Updating to latest version..."

        Push-Location $InstallDir
        try {
            # Stash any local changes
            git stash --quiet 2>$null
            git fetch origin main --quiet
            git checkout main --quiet 2>$null
            git reset --hard origin/main --quiet
            Write-Success "Updated to latest"
        } finally {
            Pop-Location
        }
    } else {
        Write-Info "Cloning ff-cli to $InstallDir..."
        git clone --quiet $RepoUrl $InstallDir
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Failed to clone repository. Check your network connection and GitHub access."
        }
        Write-Success "Repository cloned"
    }
}

function Install-Dependencies {
    Write-Info "Installing dependencies..."
    Push-Location $InstallDir
    try {
        npm install --silent --no-fund --no-audit 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "npm install failed. Check the output above for details."
        }
        Write-Success "Dependencies installed"
    } finally {
        Pop-Location
    }
}

function Build-Project {
    Write-Info "Building TypeScript source..."
    Push-Location $InstallDir
    try {
        npm run build --silent 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Build failed. Try: cd $InstallDir && npm run build"
        }
        Write-Success "Build complete"
    } finally {
        Pop-Location
    }
}

function Register-Cli {
    Write-Info "Linking CLI globally..."
    Push-Location $InstallDir
    try {
        # Unlink first if already linked
        npm unlink -g "@fluidflow/cli" 2>$null
        npm link --silent 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "npm link returned a non-zero exit code — attempting to verify..."
        } else {
            Write-Success "CLI linked globally"
        }
    } finally {
        Pop-Location
    }
}

function Test-Installation {
    Write-Host ""

    $ffCmd = Get-Command ff -ErrorAction SilentlyContinue
    if ($ffCmd) {
        try {
            $version = ff --version 2>$null
            Write-Success "Installation successful! — $version"
        } catch {
            Write-Success "Installation successful! (could not read version)"
        }
    } else {
        # npm link may have succeeded but ff isn't in PATH yet
        $npmPrefix = npm prefix -g 2>$null
        $ffPath = Join-Path $npmPrefix "ff.cmd"
        $ffPathAlt = Join-Path $npmPrefix "ff.ps1"

        if ((Test-Path $ffPath) -or (Test-Path $ffPathAlt)) {
            Write-Warn "Installed, but 'ff' is not in your PATH yet"
            Write-Host ""
            Write-Info "The npm global bin directory needs to be in your PATH."
            Write-Info "Add this directory to your PATH environment variable:"
            Write-Host ""
            Write-Host "    $npmPrefix" -ForegroundColor DarkGray
            Write-Host ""
            Write-Info "To add it permanently (run in an elevated PowerShell):"
            Write-Host ""
            Write-Host "    `$npmBin = npm prefix -g" -ForegroundColor DarkGray
            Write-Host "    [Environment]::SetEnvironmentVariable('PATH', `$env:PATH + `";`$npmBin`", 'User')" -ForegroundColor DarkGray
            Write-Host ""
            Write-Info "Then restart your terminal."
        } else {
            Write-Warn "Link may not have completed. Try running manually:"
            Write-Host ""
            Write-Host "    cd $InstallDir; npm link" -ForegroundColor DarkGray
            Write-Host ""
        }
    }
}

function Write-NextSteps {
    Write-Host ""
    Write-Host "  -- Next Steps ----------------------------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Navigate to your project directory:" -ForegroundColor White
    Write-Host "     cd C:\path\to\your-project" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  2. Launch Fluid Flow:" -ForegroundColor White
    Write-Host "     ff" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. Or install directly:" -ForegroundColor White
    Write-Host "     ff install --target cursor" -ForegroundColor White
    Write-Host "     ff install --target copilot" -ForegroundColor White
    Write-Host ""
    Write-Host "  For help:  ff --help" -ForegroundColor DarkGray
    Write-Host "  Docs:      https://github.com/BetssonGroup/cdl-ff-cli#readme" -ForegroundColor DarkGray
    Write-Host ""
}

# ── Main ────────────────────────────────────────────────

function Main {
    Write-Header

    Write-Host "  Checking prerequisites..." -ForegroundColor White
    Write-Host ""
    Test-Node
    Test-Git
    Test-Npm
    Test-Gh

    Write-Host ""
    Write-Host "  Installing Fluid Flow CLI..." -ForegroundColor White
    Write-Host ""
    Install-OrUpdate
    Install-Dependencies
    Build-Project
    Register-Cli
    Test-Installation
    Write-NextSteps
}

Main
