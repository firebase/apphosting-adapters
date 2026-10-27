/**
 * Zero-dependency semantic version parser and version gate for Next.js.
 *
 * Supported adapter version range: `>=16.3.5 <17.0.0`.
 * Security advisory warnings:
 * - `16.3.5` -> GHSA-vcvr-r3jv-pc5j (`next/og` dynamic import RCE)
 * - `<16.3.8` -> CVE-2026-94483 (`/_next/image` SSRF) & cache-poisoning CVEs
 *   (CVE-2026-94543, CVE-2026-94484)
 */

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

const SEMVER_REGEX =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export function parseSemver(version: string): ParsedSemver | null {
  if (typeof version !== "string") {
    return null;
  }
  const match = SEMVER_REGEX.exec(version.trim());
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  };
}

/**
 * Checks whether `version` satisfies `>=16.3.5 <17.0.0`.
 *
 * Note on prereleases:
 * - `16.4.3-canary.0` is in the 16.x line above 16.3.5 -> supported (`true`).
 * - `16.3.5-canary.0` precedes `16.3.5` in semver precedence -> unsupported (`false`).
 * - `17.0.0-canary.0` is in the 17.x line -> unsupported (`false`).
 */
export function isSupportedNextVersion(version: string): boolean {
  const parsed = parseSemver(version);
  if (!parsed) {
    return false;
  }
  if (parsed.major !== 16) {
    return false;
  }
  if (parsed.minor > 3) {
    return true;
  }
  if (parsed.minor < 3) {
    return false;
  }
  // minor === 3
  if (parsed.patch > 5) {
    return true;
  }
  if (parsed.patch < 5) {
    return false;
  }
  // 16.3.5: release is supported; 16.3.5-canary.x is < 16.3.5
  return parsed.prerelease === undefined;
}

/**
 * Returns security advisory warnings applicable to a supported Next.js version.
 * Never throws; returns an empty array when no advisories apply.
 */
export function getSecurityAdvisoryWarnings(version: string): string[] {
  const parsed = parseSemver(version);
  if (!parsed || parsed.major !== 16) {
    return [];
  }
  const warnings: string[] = [];

  if (parsed.minor === 3 && parsed.patch === 5) {
    warnings.push(
      `[adapter-nextjs] Security warning: Next.js ${version} is affected by GHSA-vcvr-r3jv-pc5j (RCE when next/og is dynamically imported). Upgrade to Next.js >=16.3.8.`,
    );
  }

  const isBelow160308 =
    parsed.minor < 3 ||
    (parsed.minor === 3 && parsed.patch < 8) ||
    (parsed.minor === 3 && parsed.patch === 8 && parsed.prerelease !== undefined);

  if (isBelow160308) {
    warnings.push(
      `[adapter-nextjs] Security warning: Next.js ${version} (<16.3.8) is affected by CVE-2026-94483 (/_next/image SSRF when dangerouslyAllowLocalIP is enabled) and cache-poisoning advisories (CVE-2026-94543, CVE-2026-94484). Upgrade to Next.js >=16.3.8.`,
    );
  }

  return warnings;
}
