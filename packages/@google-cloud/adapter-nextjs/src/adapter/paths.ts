import * as fs from "fs";
import * as path from "path";

/**
 * Converts a platform path to POSIX forward-slash format and normalizes it.
 */
export function toPosixPath(inputPath: string): string {
  return inputPath.replace(/\\/g, "/");
}

/**
 * Joins POSIX path segments and normalizes the result without leading `./`.
 */
export function posixJoin(...segments: string[]): string {
  const joined = path.posix.join(...segments.map(toPosixPath));
  if (joined === ".") {
    return ".";
  }
  return joined.replace(/^\.\//, "").replace(/\/+$/, "");
}

/**
 * Finds the nearest existing ancestor directory or file on disk for realpath checks.
 */
function findNearestExistingAncestor(absPath: string): string | null {
  let current = absPath;
  while (true) {
    if (fs.existsSync(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

/**
 * Validates that `targetPath` (either absolute or relative to `repoRoot`) resolves
 * strictly within `repoRoot` (including symlink resolution when paths exist on disk),
 * and returns a clean POSIX path relative to `repoRoot` (`"."` when equal to `repoRoot`).
 *
 * Throws an Error if the path is invalid, empty, absolute after relativization,
 * traverses above `repoRoot` (`..`), or escapes `repoRoot` via symlinks.
 */
export function validateRepoRelativePath(
  repoRoot: string,
  targetPath: string,
  label = "path",
): string {
  if (typeof repoRoot !== "string" || repoRoot.trim().length === 0) {
    throw new Error(`Invalid repoRoot: must be a non-empty string`);
  }
  if (typeof targetPath !== "string" || targetPath.trim().length === 0) {
    throw new Error(`Invalid ${label}: must be a non-empty string`);
  }
  if (repoRoot.includes("\0") || targetPath.includes("\0")) {
    throw new Error(`Invalid ${label}: null byte in path`);
  }

  const normalizedRepoRoot = path.resolve(toPosixPath(repoRoot));
  const normalizedTargetInput = toPosixPath(targetPath);

  // Reject explicit traversal segments in relative inputs before resolution.
  if (!path.posix.isAbsolute(normalizedTargetInput)) {
    const cleanedRel = path.posix.normalize(normalizedTargetInput);
    if (cleanedRel === ".." || cleanedRel.startsWith("../")) {
      throw new Error(`Invalid ${label} "${targetPath}": escapes repoRoot "${repoRoot}"`);
    }
  }

  const absTarget = path.isAbsolute(normalizedTargetInput)
    ? path.resolve(normalizedTargetInput)
    : path.resolve(normalizedRepoRoot, normalizedTargetInput);

  const rel = toPosixPath(path.relative(normalizedRepoRoot, absTarget));
  if (rel === "") {
    return ".";
  }
  if (rel === ".." || rel.startsWith("../") || path.posix.isAbsolute(rel)) {
    throw new Error(
      `Invalid ${label} "${targetPath}": resolves outside repoRoot "${repoRoot}" (relative: "${rel}")`,
    );
  }

  // If repoRoot exists on disk, also verify realpath containment to guard against symlinks.
  if (fs.existsSync(normalizedRepoRoot)) {
    const realRepoRoot = fs.realpathSync(normalizedRepoRoot);
    const existingTargetOrAncestor = findNearestExistingAncestor(absTarget);
    if (existingTargetOrAncestor) {
      const realExisting = fs.realpathSync(existingTargetOrAncestor);
      const realRel = toPosixPath(path.relative(realRepoRoot, realExisting));
      if (realRel === ".." || realRel.startsWith("../") || path.posix.isAbsolute(realRel)) {
        throw new Error(
          `Invalid ${label} "${targetPath}": symlink target "${realExisting}" escapes repoRoot "${realRepoRoot}"`,
        );
      }
    }
  }

  const normalizedPosix = path.posix.normalize(rel).replace(/^\.\//, "").replace(/\/+$/, "");
  return normalizedPosix === "" ? "." : normalizedPosix;
}

/**
 * Computes and validates the POSIX relative path from `baseDir` to `childDir`,
 * ensuring `childDir` does not escape `baseDir`. Returns `""` when `baseDir === childDir`.
 */
export function validateContainedSubpath(
  baseDir: string,
  childDir: string,
  label = "subpath",
): string {
  if (typeof baseDir !== "string" || baseDir.trim().length === 0) {
    throw new Error(`Invalid baseDir for ${label}`);
  }
  if (typeof childDir !== "string" || childDir.trim().length === 0) {
    throw new Error(`Invalid childDir for ${label}`);
  }
  const absBase = path.resolve(toPosixPath(baseDir));
  const absChild = path.resolve(toPosixPath(childDir));
  const rel = toPosixPath(path.relative(absBase, absChild));
  if (rel === "" || rel === ".") {
    return "";
  }
  if (rel === ".." || rel.startsWith("../") || path.posix.isAbsolute(rel)) {
    throw new Error(`Invalid ${label}: "${childDir}" is outside "${baseDir}" (relative: "${rel}")`);
  }
  return path.posix.normalize(rel).replace(/^\.\//, "").replace(/\/+$/, "");
}
