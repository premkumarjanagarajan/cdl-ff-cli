/**
 * Copilot Adapter
 *
 * Transforms Cursor-specific rule files and workflow content into
 * GitHub Copilot compatible formats.
 *
 * Transformations applied for Copilot installs:
 *
 *  1. Entry point: strip `.mdc` YAML frontmatter, adjust relative
 *     paths from depth-2 (.cursor/rules/) to depth-1 (.github/)
 *
 *  2. All workflow .md files: strip Cursor-specific YAML frontmatter
 *     (name, description, alwaysApply) since these fields are
 *     meaningless in Copilot context
 *
 *  3. Technology instructions: create Copilot-native path-specific
 *     .instructions.md files in .github/instructions/ with proper
 *     applyTo frontmatter
 *
 * Reference: https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot
 */

// ── Entry point transformation ──────────────────────────

/**
 * Transform a Cursor .mdc rule file into GitHub Copilot
 * copilot-instructions.md format.
 *
 * - Strips Cursor YAML frontmatter (name, description, alwaysApply)
 * - Adjusts path depth: ../../ → ../ (from depth-2 to depth-1)
 */
export function transformEntryPointForCopilot(mdcContent: string): string {
  let content = mdcContent;

  // 1. Strip Cursor-specific YAML frontmatter
  content = stripCursorFrontmatter(content);

  // 2. Adjust relative path depth
  //    .cursor/rules/workflow.mdc -> ../../ to reach project root
  //    .github/copilot-instructions.md -> ../ to reach project root
  content = adjustPathDepth(content);

  // 3. Remove leading whitespace/newlines left by frontmatter removal
  content = content.replace(/^\n+/, "");

  return content;
}

// ── Frontmatter stripping (for all workflow .md files) ──

/**
 * Strip Cursor-specific YAML frontmatter from any markdown file.
 *
 * Cursor .mdc and workflow .md files use frontmatter like:
 * ```
 * ---
 * name: rule-name
 * description: ...
 * alwaysApply: true
 * ---
 * ```
 *
 * These fields (name, description, alwaysApply) are Cursor-specific
 * and have no meaning in GitHub Copilot. Stripping them ensures
 * clean content when the AI reads these files.
 *
 * Only strips frontmatter that contains Cursor-specific fields.
 * Frontmatter with non-Cursor fields is left intact.
 */
export function stripCursorFrontmatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return content;

  const frontmatterBody = match[1]!;

  // Check if the frontmatter contains Cursor-specific fields
  const cursorFields = [
    /^name\s*:/m,
    /^description\s*:/m,
    /^alwaysApply\s*:/m,
  ];

  const hasCursorFields = cursorFields.some((re) => re.test(frontmatterBody));

  if (!hasCursorFields) {
    // Not Cursor frontmatter — leave it alone
    return content;
  }

  // Strip the entire frontmatter block
  const stripped = content.slice(match[0].length);

  // Clean up leading blank lines
  return stripped.replace(/^\n+/, "\n");
}

/**
 * Check whether a file's content contains Cursor-specific frontmatter
 * that should be stripped for Copilot compatibility.
 */
export function hasCursorFrontmatter(content: string): boolean {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return false;

  const body = match[1]!;
  return (
    /^name\s*:/m.test(body) ||
    /^description\s*:/m.test(body) ||
    /^alwaysApply\s*:/m.test(body)
  );
}

// ── Technology instruction transformation ───────────────

/**
 * Mapping of technology instruction source paths to their
 * Copilot path-specific instruction configuration.
 *
 * Source: main-workflow/Instructions/technology/{tech}/general.md
 * Target: .github/instructions/{tech}.instructions.md
 *
 * Reference for applyTo glob syntax:
 * https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot#creating-path-specific-custom-instructions
 */
export interface TechInstructionMapping {
  /** Source file relative path within the repo (e.g., "csharp/general.md") */
  sourceRelPath: string;
  /** Output file name (e.g., "csharp.instructions.md") */
  instructionFileName: string;
  /** Copilot applyTo glob pattern */
  applyTo: string;
}

export const TECH_INSTRUCTION_MAPPINGS: TechInstructionMapping[] = [
  {
    sourceRelPath: "csharp/general.md",
    instructionFileName: "csharp.instructions.md",
    applyTo: "**/*.cs",
  },
  {
    sourceRelPath: "dotnet/general.md",
    instructionFileName: "dotnet.instructions.md",
    applyTo: "**/*.cs,**/*.csproj,**/*.sln",
  },
  {
    sourceRelPath: "terraform/general.md",
    instructionFileName: "terraform.instructions.md",
    applyTo: "**/*.tf,**/*.tfvars",
  },
];

/**
 * Transform a technology instruction file into Copilot path-specific
 * instruction format.
 *
 * - Strips any Cursor frontmatter
 * - Prepends Copilot-compatible applyTo frontmatter
 *
 * Output has a YAML frontmatter block with applyTo, followed
 * by the original content with Cursor frontmatter removed.
 */
export function transformTechInstruction(
  content: string,
  applyTo: string
): string {
  // Strip any existing Cursor frontmatter
  let body = stripCursorFrontmatter(content);

  // Clean leading whitespace
  body = body.replace(/^\n+/, "");

  // Prepend Copilot applyTo frontmatter
  return `---\napplyTo: "${applyTo}"\n---\n\n${body}`;
}

// ── Path adjustment ─────────────────────────────────────

/**
 * Adjust relative path references to account for the entry point
 * moving from `.cursor/rules/` (2 levels deep) to `.github/` (1 level deep).
 *
 * All `../../` prefixes in path references become `../`
 */
function adjustPathDepth(content: string): string {
  // Match ../../ that appears as a relative path reference
  // (both in backtick-wrapped references and plain text)
  return content.replace(/\.\.\/\.\.\//g, "../");
}

/**
 * Check if content looks like a Cursor .mdc file (has the expected frontmatter).
 */
export function isMdcFile(content: string): boolean {
  return /^---\n[\s\S]*?alwaysApply\s*:\s*(true|false)[\s\S]*?\n---/.test(
    content
  );
}
