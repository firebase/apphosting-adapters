import * as path from "path";
import type { BundleYamlV2, NextOutputMode } from "../contracts";
import { posixJoin, validateContainedSubpath, validateRepoRelativePath } from "../adapter/paths";

export const ADAPTER_PACKAGE_NAME = "@google-cloud/adapter-nextjs";
export const ADAPTER_VERSION = "0.1.0";
export const RUNTIME_MANIFEST_REL_PATH = ".cloudrun/next-routing.json";

export interface BuildBundlePathsInput {
  repoRoot: string;
  projectDir: string;
  distDir: string;
  nextVersion: string;
  buildId: string;
  config: {
    output?: string;
    distDir?: string;
    outputFileTracingRoot?: string;
    [key: string]: unknown;
  };
}

export interface ComputedAdapterPaths {
  outputMode: NextOutputMode;
  projectDir: string;
  distDir: string;
  serverDir: string;
  bundle: BundleYamlV2;
}

/**
 * Computes validated repo-relative paths and builds the `BundleYamlV2` structure
 * per design spec, §3.3.
 */
export function buildBundleManifest(input: BuildBundlePathsInput): ComputedAdapterPaths {
  const { repoRoot, projectDir, distDir, nextVersion, buildId, config } = input;

  const projectDirRel = validateRepoRelativePath(repoRoot, projectDir, "projectDir");
  const distDirRel = validateRepoRelativePath(repoRoot, distDir, "distDir");
  const cloudrunRel = validateRepoRelativePath(
    repoRoot,
    path.join(repoRoot, ".cloudrun"),
    ".cloudrun",
  );
  const runtimeManifestRel = validateRepoRelativePath(
    repoRoot,
    path.join(repoRoot, RUNTIME_MANIFEST_REL_PATH),
    "runtimeManifest",
  );

  const outputMode: NextOutputMode = config?.output === "export" ? "export" : "standalone";

  if (outputMode === "export") {
    const hasCustomExportOutput =
      typeof config?.distDir === "string" &&
      config.distDir.trim().length > 0 &&
      config.distDir !== ".next";
    const absExportDir = hasCustomExportOutput
      ? path.resolve(projectDir, config.distDir as string)
      : path.join(projectDir, "out");

    const exportDirRel = validateRepoRelativePath(repoRoot, absExportDir, "exportDir");

    const bundle: BundleYamlV2 = {
      version: "v2",
      metadata: {
        adapterPackageName: ADAPTER_PACKAGE_NAME,
        adapterVersion: ADAPTER_VERSION,
        framework: "nextjs",
        frameworkVersion: nextVersion,
        buildId: String(buildId ?? ""),
        outputMode: "export",
        projectDir: projectDirRel,
        distDir: distDirRel,
        serverDir: exportDirRel,
        runtimeManifest: runtimeManifestRel,
      },
      outputFiles: {
        serverApp: {
          include: [cloudrunRel, exportDirRel],
        },
      },
    };

    return {
      outputMode,
      projectDir: projectDirRel,
      distDir: distDirRel,
      serverDir: exportDirRel,
      bundle,
    };
  }

  // Standalone mode:
  // Next's writeStandaloneDirectory places app files inside:
  //   path.join(distDir, 'standalone', path.relative(outputFileTracingRoot, projectDir))
  const tracingRoot =
    typeof config?.outputFileTracingRoot === "string" &&
    config.outputFileTracingRoot.trim().length > 0
      ? config.outputFileTracingRoot
      : repoRoot;

  const relProjectFromTracing = validateContainedSubpath(
    tracingRoot,
    projectDir,
    "projectDir relative to outputFileTracingRoot",
  );

  const absStandaloneRoot = path.join(distDir, "standalone");
  const standaloneRootRel = validateRepoRelativePath(repoRoot, absStandaloneRoot, "standaloneDir");

  const absServerDir =
    relProjectFromTracing.length > 0
      ? path.join(absStandaloneRoot, relProjectFromTracing)
      : absStandaloneRoot;
  const serverDirRel = validateRepoRelativePath(repoRoot, absServerDir, "serverDir");

  // Relative distDir inside projectDir (typically ".next")
  const distDirRelToProject = validateContainedSubpath(
    projectDir,
    distDir,
    "distDir relative to projectDir",
  );
  if (!distDirRelToProject) {
    throw new Error(`Invalid distDir "${distDir}": cannot equal projectDir "${projectDir}"`);
  }

  const publicFromRel = validateRepoRelativePath(
    repoRoot,
    path.join(projectDir, "public"),
    "publicDir",
  );
  const publicToRel = validateRepoRelativePath(
    repoRoot,
    path.join(repoRoot, posixJoin(serverDirRel, "public")),
    "standalonePublicDir",
  );

  const staticFromRel = validateRepoRelativePath(
    repoRoot,
    path.join(distDir, "static"),
    "staticDir",
  );
  const staticToRel = validateRepoRelativePath(
    repoRoot,
    path.join(repoRoot, posixJoin(serverDirRel, distDirRelToProject, "static")),
    "standaloneStaticDir",
  );

  const bundle: BundleYamlV2 = {
    version: "v2",
    runConfig: {
      runCommand: "node .cloudrun/serve.js",
      projectRunCommand: "node .cloudrun/serve.js --project",
    },
    metadata: {
      adapterPackageName: ADAPTER_PACKAGE_NAME,
      adapterVersion: ADAPTER_VERSION,
      framework: "nextjs",
      frameworkVersion: nextVersion,
      buildId: String(buildId ?? ""),
      outputMode: "standalone",
      projectDir: projectDirRel,
      distDir: distDirRel,
      serverDir: serverDirRel,
      runtimeManifest: runtimeManifestRel,
    },
    outputFiles: {
      serverApp: {
        include: [cloudrunRel, standaloneRootRel],
        copy: [
          {
            from: publicFromRel,
            to: publicToRel,
          },
          {
            from: staticFromRel,
            to: staticToRel,
          },
        ],
      },
    },
  };

  return {
    outputMode,
    projectDir: projectDirRel,
    distDir: distDirRel,
    serverDir: serverDirRel,
    bundle,
  };
}
