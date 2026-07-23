interface Scenario {
  inputs: string[];
  expectedBundleYaml: {};
  tests?: string[]; // List of test files to run
}

export const scenarios: Map<string, Scenario> = new Map([
  [
    "nextjs-app",
    {
      inputs: ["./", "--framework", "nextjs"],
      expectedBundleYaml: {
        version: "v1",
        runConfig: {
          runCommand: "node .next/standalone/server.js",
        },
        metadata: {
          adapterPackageName: "@apphosting/adapter-nextjs",
        },
      },
      tests: ["adapter-builds.spec.ts"],
    },
  ],
  [
    "angular-app",
    {
      inputs: ["./", "--framework", "angular"],
      expectedBundleYaml: {
        version: "v1",
        runConfig: {
          runCommand: "node dist/firebase-app-hosting-angular/server/server.mjs",
          environmentVariables: [],
        },
        metadata: {
          adapterPackageName: "@apphosting/adapter-angular",
        },
      },
      tests: ["adapter-builds.spec.ts"],
    },
  ],
]);
