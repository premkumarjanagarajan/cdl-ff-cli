import fs from "node:fs";
import path from "node:path";

/**
 * Recursively copy a directory from `src` to `dest`.
 * Creates destination directories as needed.
 * Returns the list of files copied.
 */
export async function copyRecursive(
  src: string,
  dest: string,
  options: { overwrite?: boolean } = {}
): Promise<string[]> {
  const { overwrite = true } = options;
  const copied: string[] = [];

  await ensureDirectory(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      const sub = await copyRecursive(srcPath, destPath, options);
      copied.push(...sub);
    } else {
      if (!overwrite && fs.existsSync(destPath)) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
      copied.push(destPath);
    }
  }

  return copied;
}

/**
 * Recursively delete a directory and all its contents.
 */
export function removeDirectory(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export async function ensureDirectory(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Check if a path exists (file or directory).
 */
export function pathExists(p: string): boolean {
  return fs.existsSync(p);
}

/**
 * Check if a path is a directory.
 */
export function isDirectory(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

/**
 * Read a file as UTF-8 text.
 */
export function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Write UTF-8 text to a file, creating parent directories as needed.
 */
export async function writeText(
  filePath: string,
  content: string
): Promise<void> {
  await ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Make a file executable (chmod +x).
 */
export function makeExecutable(filePath: string): void {
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {
    // Silently fail on Windows or permission issues
  }
}

/**
 * Recursively find all files matching a predicate.
 */
export function findFiles(
  dir: string,
  predicate: (filePath: string) => boolean
): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Count files in a directory recursively.
 */
export function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }
  return count;
}
