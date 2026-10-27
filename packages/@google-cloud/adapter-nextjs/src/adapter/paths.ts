import * as fs from "fs";
import * as path from "path";

/**
 * Converts a platform path to POSIX forward-slash format and normalizes it.
 */
export function toPosixPath(inputPath: string): string {
  return inputPath.replace(/\\/g, "/");
}

/**
 * Removes trailing `/` characters in linear time. (A `/\/+$/` regex is polynomial on inputs
 * with long runs of `/`, and these paths come from the build.)
 */
function stripTrailingSlashes(input: string): string {
  let end = input.length;
  while (end > 0 && input.charCodeAt(end - 1) === 47 /* "/" */) {
    end--;
  }
  return input.slice(0, end);
}

/**
 * Returns true when a `path.relative()` result points outside its base directory: either a
 * parent traversal or, on Windows, an absolute path on another drive (e.g. `D:\x`), which
 * `path.posix.isAbsolute` alone would miss.
 */
function isOutsideBase(rawRelative: string): boolean {
  const rel = toPosixPath(rawRelative);
  return (
    rel === ".." ||
    rel.startsWith("../") ||
    path.isAbsolute(rawRelative) ||
    path.posix.isAbsolute(rel)
  );
}

/**
 * Joins POSIX path segments and normalizes the result without leading `./`.
 */
export function posixJoin(...segments: string[]): string {
  const joined = path.posix.join(...segments.map(toPosixPath));
  if (joined === ".") {
    return ".";
  }
  return stripTrailingSlashes(joined.replace(/^\.\//, ""));
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

  const rawRel = path.relative(normalizedRepoRoot, absTarget);
  const rel = toPosixPath(rawRel);
  if (rel === "") {
    return ".";
  }
  if (isOutsideBase(rawRel)) {
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
      if (isOutsideBase(path.relative(realRepoRoot, realExisting))) {
        throw new Error(
          `Invalid ${label} "${targetPath}": symlink target "${realExisting}" escapes repoRoot "${realRepoRoot}"`,
        );
      }
    }
  }

  const normalizedPosix = stripTrailingSlashes(path.posix.normalize(rel).replace(/^\.\//, ""));
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
  const rawRel = path.relative(absBase, absChild);
  const rel = toPosixPath(rawRel);
  if (rel === "" || rel === ".") {
    return "";
  }
  if (isOutsideBase(rawRel)) {
    throw new Error(`Invalid ${label}: "${childDir}" is outside "${baseDir}" (relative: "${rel}")`);
  }
  return stripTrailingSlashes(path.posix.normalize(rel).replace(/^\.\//, ""));
}
