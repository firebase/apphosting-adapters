const importUtils = import("@apphosting/adapter-angular/dist/utils.js");
import assert from "assert";
import { resolve } from "path";
import fs from "fs";
import path from "path";
import os from "os";
import { OutputBundleOptions } from "../interface.js";

describe("build commands", () => {
  let tmpDir: string;
  let outputBundleOptions: OutputBundleOptions;
  let defaultAngularVersion: string;
  beforeEach(() => {
    tmpDir = generateTmpDir();
    outputBundleOptions = {
      browserDirectory: resolve(tmpDir, "dist", "test", "browser"),
      bundleYamlPath: resolve(tmpDir, ".apphosting", "bundle.yaml"),
      outputDirectoryBasePath: resolve(tmpDir, ".apphosting"),
      serverFilePath: resolve(tmpDir, "dist", "test", "server", "server.mjs"),
      needsServerGenerated: false,
    };
    defaultAngularVersion = "17.3.8";
  });

  it("expects all output bundle files to be generated", async () => {
    const { generateBuildOutput, validateOutputDirectory, createMetadata } = await importUtils;
    const files = {
      "dist/test/browser/browserfile": "",
      "dist/test/server/server.mjs": "",
    };
    const packageVersion = createMetadata(defaultAngularVersion).adapterVersion;
    generateTestFiles(tmpDir, files);
    await generateBuildOutput(tmpDir, outputBundleOptions, defaultAngularVersion);
    await validateOutputDirectory(outputBundleOptions);

    const expectedFiles = {
      "dist/test/browser/browserfile": "",
      "dist/test/server/server.mjs": "",
      ".apphosting/bundle.yaml": `version: v1
runConfig:
  runCommand: node dist/test/server/server.mjs
  environmentVariables: []
metadata:
  adapterPackageName: "@apphosting/adapter-angular"
  adapterVersion: ${packageVersion}
  framework: angular
  frameworkVersion: 17.3.8
`,
    };
    validateTestFiles(tmpDir, expectedFiles);
  });

  it("expects SSR_PORT variable is added to bundle.yaml for Angular v17.3.2", async () => {
    const { generateBuildOutput } = await importUtils;
    const files = {
      "dist/test/browser/browserfile": "",
      "dist/test/server/server.mjs": "",
    };
    generateTestFiles(tmpDir, files);
    await generateBuildOutput(tmpDir, outputBundleOptions, "17.3.2");

    const expectedContents = `  environmentVariables:
    - variable: SSR_PORT
      value: "8080"
      availability:
        - RUNTIME`;
    validateFileExistsAndContains(tmpDir, ".apphosting/bundle.yaml", expectedContents);
  });

  it("test failed validateOutputDirectory", async () => {
    const { generateBuildOutput, validateOutputDirectory } = await importUtils;
    const files = {
      "dist/test/browser/browserfile": "",
      "dist/test/server/notserver.mjs": "",
    };
    generateTestFiles(tmpDir, files);
    await generateBuildOutput(tmpDir, outputBundleOptions, defaultAngularVersion);
    assert.rejects(async () => await validateOutputDirectory(outputBundleOptions));
  });

  it("test populate output bundle options", async () => {
    const { populateOutputBundleOptions } = await importUtils;
    const expectedOutputBundleOptions = {
      browserDirectory: "/browser",
      bundleYamlPath: resolve(".apphosting", "bundle.yaml"),
      outputDirectoryBasePath: resolve(".apphosting"),
      needsServerGenerated: false,
      serverFilePath: path.join("/server", "server.mjs"),
    };
    const outputPaths = {
      root: new URL("file:///test"),
      server: new URL("file:///server"),
      browser: new URL("file:///browser"),
    };
    assert.deepEqual(populateOutputBundleOptions(outputPaths), expectedOutputBundleOptions);
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
function generateTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "test-files"));
}

function generateTestFiles(baseDir: string, filesToGenerate: object): void {
  Object.entries(filesToGenerate).forEach((file) => {
    const fileName = file[0];
    const contents = file[1];
    const fileToGenerate = path.join(baseDir, fileName);
    fs.mkdirSync(path.dirname(fileToGenerate), { recursive: true });
    fs.writeFileSync(fileToGenerate, contents);
  });
}

function ignoreBlankLines(text: string) {
  return text.replace(/^\s*[\r\n]/gm, "");
}

function validateTestFiles(baseDir: string, expectedFiles: object): void {
  Object.entries(expectedFiles).forEach((file) => {
    const fileName = file[0];
    const expectedContents = file[1];
    const fileToRead = path.join(baseDir, fileName);
    const contents = fs.readFileSync(fileToRead).toString();
    assert.deepEqual(ignoreBlankLines(contents), ignoreBlankLines(expectedContents));
  });
}

function validateFileExistsAndContains(
  baseDir: string,
  expectedFileName: string,
  expectedContents: string,
): void {
  const fileToRead = path.join(baseDir, expectedFileName);
  assert.ok(fs.existsSync(fileToRead), `File '${fileToRead}' does not exist.`);
  const contents = fs.readFileSync(fileToRead).toString();
  assert.ok(
    contents.includes(expectedContents),
    `Actual contents do not contain expected contents.\nExpected contained contents:\n${expectedContents}\nActual:\n${contents}`,
  );
}
