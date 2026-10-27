import type { BundleYamlV2 } from "../contracts";

function yamlQuote(value: string): string {
  return JSON.stringify(value);
}

/**
 * Deterministic, zero-dependency YAML serializer for `BundleYamlV2` matching
 * the exact schema and field ordering of design spec and `pkg/webbundle`.
 */
export function serializeBundleYamlV2(bundle: BundleYamlV2): string {
  const lines: string[] = [];

  lines.push(`version: ${yamlQuote(bundle.version)}`);

  if (bundle.runConfig && typeof bundle.runConfig.runCommand === "string") {
    lines.push("runConfig:");
    lines.push(`  runCommand: ${yamlQuote(bundle.runConfig.runCommand)}`);
    if (typeof bundle.runConfig.projectRunCommand === "string") {
      lines.push(`  projectRunCommand: ${yamlQuote(bundle.runConfig.projectRunCommand)}`);
    }
  }

  lines.push("metadata:");
  lines.push(`  adapterPackageName: ${yamlQuote(bundle.metadata.adapterPackageName)}`);
  lines.push(`  adapterVersion: ${yamlQuote(bundle.metadata.adapterVersion)}`);
  lines.push(`  framework: ${yamlQuote(bundle.metadata.framework)}`);
  lines.push(`  frameworkVersion: ${yamlQuote(bundle.metadata.frameworkVersion)}`);
  lines.push(`  buildId: ${yamlQuote(bundle.metadata.buildId)}`);
  lines.push(`  outputMode: ${yamlQuote(bundle.metadata.outputMode)}`);
  lines.push(`  projectDir: ${yamlQuote(bundle.metadata.projectDir)}`);
  lines.push(`  distDir: ${yamlQuote(bundle.metadata.distDir)}`);
  lines.push(`  serverDir: ${yamlQuote(bundle.metadata.serverDir)}`);
  lines.push(`  runtimeManifest: ${yamlQuote(bundle.metadata.runtimeManifest)}`);

  lines.push("outputFiles:");
  lines.push("  serverApp:");
  lines.push("    include:");
  for (const item of bundle.outputFiles.serverApp.include) {
    lines.push(`      - ${yamlQuote(item)}`);
  }

  if (bundle.outputFiles.serverApp.copy && bundle.outputFiles.serverApp.copy.length > 0) {
    lines.push("    copy:");
    for (const copyRule of bundle.outputFiles.serverApp.copy) {
      lines.push(`      - from: ${yamlQuote(copyRule.from)}`);
      lines.push(`        to: ${yamlQuote(copyRule.to)}`);
    }
  }

  return lines.join("\n") + "\n";
}
