const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const rootDir = path.resolve(__dirname, "..");

function moveFileSync(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (err.code === "EXDEV") {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    } else {
      throw err;
    }
  }
}

const packages = [
  { name: "@apphosting/common", path: "packages/@apphosting/common" },
  { name: "@apphosting/adapter-nextjs", path: "packages/@apphosting/adapter-nextjs" },
  { name: "@apphosting/adapter-angular", path: "packages/@apphosting/adapter-angular" },
  { name: "@apphosting/build", path: "packages/@apphosting/build" },
  { name: "@apphosting/create", path: "packages/@apphosting/create" },
  { name: "@apphosting/discover", path: "packages/@apphosting/discover" },
  { name: "create-next-on-firebase", path: "packages/create-next-on-firebase" },
  { name: "firebase-frameworks", path: "packages/firebase-frameworks" },
];

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "package-verify-"));
console.log(`Temp dir for tarballs: ${tempDir}`);

const tarballs = {};

try {
  // 1. Pack built packages
  const packagesToPack = packages.filter((pkg) => {
    const hasDist = fs.existsSync(path.join(rootDir, pkg.path, "dist"));
    if (!hasDist) {
      console.log(`Skipping ${pkg.name} (not built)`);
    }
    return hasDist;
  });
  const builtPackageNames = new Set(packagesToPack.map((p) => p.name));

  for (const pkg of packagesToPack) {
    const pkgPath = path.join(rootDir, pkg.path);
    console.log(`Packing ${pkg.name}...`);
    const output = execSync("npm pack --json", { cwd: pkgPath, encoding: "utf8" });
    const tarballName = JSON.parse(output)[0].filename;
    const tarballPath = path.join(pkgPath, tarballName);
    const destPath = path.join(tempDir, tarballName);
    moveFileSync(tarballPath, destPath);
    tarballs[pkg.name] = destPath;
  }

  // 2. Define verification tasks
  const tasks = [
    {
      name: "@apphosting/common",
      localDeps: [],
      peerDeps: [],
      checks: [{ type: "import", target: "@apphosting/common" }],
    },
    {
      name: "@apphosting/adapter-nextjs",
      localDeps: ["@apphosting/common"],
      peerDeps: ["next@~14.0.0", "react@~18.2.0", "react-dom@~18.2.0", "typescript@^5.2.0"],
      checks: [
        { type: "import-binary", target: "@apphosting/adapter-nextjs/dist/bin/build.js" },
        { type: "import-binary", target: "@apphosting/adapter-nextjs/dist/bin/create.js" },
      ],
    },
    {
      name: "@apphosting/adapter-angular",
      localDeps: ["@apphosting/common"],
      peerDeps: [
        "@angular/core@~17.2.0",
        "@angular-devkit/core@~17.2.0",
        "@angular-devkit/architect@~0.1702.0",
        "typescript@^5.2.0",
      ],
      checks: [
        { type: "import-binary", target: "@apphosting/adapter-angular/dist/bin/build.js" },
        { type: "import-binary", target: "@apphosting/adapter-angular/dist/bin/create.js" },
      ],
    },
    {
      name: "@apphosting/build",
      localDeps: ["@apphosting/common"],
      peerDeps: [],
      checks: [
        {
          type: "binary",
          name: "apphosting-local-build",
          cmd: "./node_modules/.bin/apphosting-local-build --help",
        },
      ],
    },
    {
      name: "@apphosting/create",
      localDeps: [],
      peerDeps: [],
      checks: [{ type: "binary", name: "create", cmd: "./node_modules/.bin/create --help" }],
    },
    {
      name: "@apphosting/discover",
      localDeps: [],
      peerDeps: [],
      checks: [{ type: "binary", name: "discover", cmd: "./node_modules/.bin/discover --help" }],
    },
    {
      name: "create-next-on-firebase",
      localDeps: [],
      peerDeps: [],
      checks: [
        {
          type: "binary",
          name: "create-next-on-firebase",
          cmd: "./node_modules/.bin/create-next-on-firebase --help",
        },
      ],
    },
    {
      name: "firebase-frameworks",
      localDeps: [],
      // Install peer deps to allow import verification
      peerDeps: ["firebase-admin@^12.0.0", "firebase@^10.0.0", "sharp@^0.33.0"],
      checks: [{ type: "import", target: "firebase-frameworks" }],
    },
  ];

  // 3. Run tasks
  for (const task of tasks) {
    if (!builtPackageNames.has(task.name)) {
      console.log(`Skipping verification for ${task.name} (not built)`);
      continue;
    }
    console.log(`\n========================================`);
    console.log(`Running verification for ${task.name}`);
    console.log(`========================================`);

    const taskTempDir = fs.mkdtempSync(path.join(tempDir, `task-${task.name.replace("/", "-")}-`));
    const testProjDir = path.join(taskTempDir, "test-project");
    fs.mkdirSync(testProjDir);
    fs.writeFileSync(
      path.join(testProjDir, "package.json"),
      JSON.stringify({
        name: "test-project",
        private: true,
        type: "module",
      }),
    );

    // Collect tarballs to install (self + localDeps)
    const tarballsToInstall = [tarballs[task.name]];
    for (const dep of task.localDeps) {
      tarballsToInstall.push(tarballs[dep]);
    }

    const installArgs = [...task.peerDeps, ...tarballsToInstall].map((arg) => `"${arg}"`).join(" ");
    console.log(`Installing dependencies for ${task.name}...`);
    execSync(`npm install --no-audit --no-fund ${installArgs}`, {
      cwd: testProjDir,
      stdio: "inherit",
    });

    // Run checks
    for (const check of task.checks) {
      if (check.type === "binary") {
        console.log(`Testing binary: ${check.name}...`);
        try {
          execSync(check.cmd, { cwd: testProjDir, stdio: "inherit" });
          console.log(`Binary ${check.name} passed.`);
        } catch (error) {
          console.error(`Binary ${check.name} failed!`);
          throw error;
        }
      } else if (check.type === "import-binary") {
        console.log(`Testing import of binary: ${check.target}...`);
        try {
          execSync(`node -e "import('${check.target}')"`, { cwd: testProjDir, stdio: "inherit" });
          console.log(`Binary import ${check.target} passed.`);
        } catch (error) {
          console.error(`Binary import ${check.target} failed!`);
          throw error;
        }
      } else if (check.type === "import") {
        console.log(`Testing import: ${check.target}...`);
        try {
          execSync(`node -e "import('${check.target}')"`, { cwd: testProjDir, stdio: "inherit" });
          console.log(`Import ${check.target} passed.`);
        } catch (error) {
          console.error(`Import ${check.target} failed!`);
          throw error;
        }
      }
    }
    console.log(`Verification for ${task.name} passed.`);
  }

  console.log("\nAll verifications finished successfully.");
} finally {
  console.log("Cleaning up tarballs and task directories...");
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to cleanup temp dir ${tempDir}:`, err);
  }
}
