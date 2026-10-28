# `@google-cloud/adapter-nextjs`

Google Cloud Run build & runtime adapter for Next.js (`>=16.3.5 <17.0.0`).

When loaded by Next.js during `next build` via `NEXT_ADAPTER_PATH`, `@google-cloud/adapter-nextjs` configures Next.js for Cloud Run production builds and emits a self-contained `.cloudrun/` deployment bundle and routing manifest.

---

## Lifecycle Hooks

### `modifyConfig(config, { phase })`

Runs only during `phase-production-build`:

- **Version gate**: Requires Next.js `>=16.3.5 <17.0.0`. Outside this range, logs a warning and returns `config` untouched.
- **Security advisories**: Emits non-fatal warnings when building on Next.js versions with known security advisories (`16.3.5` GHSA-vcvr-r3jv-pc5j, `<16.3.8` CVE-2026-94483 / CVE-2026-94543 / CVE-2026-94484).
- **Standalone output**: Sets `output: 'standalone'` when `config.output` is unset (preserves `output: 'export'` and explicit `output: 'standalone'`).
- **Build cache**: Sets `experimental.turbopackFileSystemCacheForBuild = false` unless explicitly configured by the user. Cloud Run never restores `.next/cache`, so this avoids ~48 MiB of unused cache in container layers.
- **Browser source maps**: Sets `productionBrowserSourceMaps: true` only when `CRASHLYTICS_UPLOAD_MAPPING=true` and `config.productionBrowserSourceMaps` is unset.

### `onBuildComplete(ctx)`

Writes four files under `<repoRoot>/.cloudrun/` (`bundle.yaml` is written last via atomic temp-file write + `fs.renameSync` so its presence guarantees a complete bundle):

| File                          | Description                                                                                                                                                                           |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.cloudrun/package.json`      | `{"type": "commonjs"}` — ensures Node treats `.cloudrun/serve.js` as CommonJS even when the repository root `package.json` sets `"type": "module"`.                                   |
| `.cloudrun/serve.js`          | Pre-bundled CommonJS entry point (includes `@next/routing`) that starts Next's server and keeps responses for routes that `proxy.ts` / `middleware.ts` runs on out of shared caches. |
| `.cloudrun/next-routing.json` | Version 1 routing manifest consumed by `.cloudrun/serve.js` at runtime.                                                                                                               |
| `.cloudrun/bundle.yaml`       | Version `v2` Cloud Run web bundle manifest consumed by the `webbundle` buildpack, which prunes the image and sets the start command.                                                 |

If any error occurs during `onBuildComplete`, the adapter logs a warning, removes any partial `.cloudrun/bundle.yaml`, and returns without throwing (fail-open to normal buildpack behavior).

---

## `.cloudrun/` Contract

### `.cloudrun/bundle.yaml` (`BundleYamlV2`)

```yaml
version: "v2"
runConfig:
  runCommand: "node .cloudrun/serve.js"
  projectRunCommand: "node .cloudrun/serve.js --project"
metadata:
  adapterPackageName: "@google-cloud/adapter-nextjs"
  adapterVersion: "0.1.0"
  framework: "nextjs"
  frameworkVersion: "16.4.3"
  buildId: "<buildId>"
  outputMode: "standalone" # or "export"
  projectDir: "<repo-relative path>"
  distDir: "<repo-relative path>"
  serverDir: "<repo-relative path to directory containing server.js>"
  runtimeManifest: ".cloudrun/next-routing.json"
outputFiles:
  serverApp:
    include:
      - ".cloudrun"
      - "<distDir>/standalone"
    copy:
      - from: "<projectDir>/public"
        to: "<serverDir>/public"
      - from: "<distDir>/static"
        to: "<serverDir>/<distDirBase>/static"
```

- All paths in `bundle.yaml` are normalized POSIX relative paths anchored at `repoRoot` (`NEXT_PRIVATE_OUTPUT_TRACE_ROOT`) and validated against path traversal (`..`) and symlinks escaping `repoRoot`.
- When `config.output === 'export'`, `runConfig` is omitted, `outputMode` is `"export"`, and `outputFiles.serverApp` includes `[".cloudrun", "<exportDir>"]`.

### `.cloudrun/next-routing.json` (`NextRoutingManifest` v1)

- Contains `version: 1`, `nextVersion`, `adapterVersion`, `buildId`, `outputMode`, `projectDir`, `distDir`, `serverDir`, `basePath`, `i18n`, `routing`, `pathnames`, `middleware`, `routes`, `prerenders`, and `edgeOutputs`.
- **Fail-closed middleware matching**: Strips `has` and `missing` conditions from `routing.middlewareMatchers` and `middleware.matchers`, so `serve.js` treats every path a conditional `proxy.ts` / `middleware.ts` matcher could run on as protected.
- **Secret scrubbing**: Never copies `prerenderManifest.preview` secrets (`previewModeId`, `previewModeSigningKey`, `previewModeEncryptionKey`), `bypassToken`, or internal `x-prerender-revalidate` / `__prerender_bypass` conditions.
- **Size discipline**: Drops internal `.rsc` and `.segments/*` flight duplicates from `routes`, `prerenders`, and `pathnames`, and `/_next/static/*` chunk entries from `routes` and `pathnames`.

---

## Environment Variables

| Variable                         | Phase                | Description                                                                                                                     |
| :------------------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_ADAPTER_PATH`              | Build (`next build`) | Absolute path to `@google-cloud/adapter-nextjs` (`dist/index.js`) used by Next.js to load the adapter.                          |
| `NEXT_PRIVATE_OUTPUT_TRACE_ROOT` | Build (`next build`) | Repository/workspace root (`/workspace` on Cloud Run). Used as `repoRoot` for relative paths and `.cloudrun/` output placement. |
| `CRASHLYTICS_UPLOAD_MAPPING`     | Build (`next build`) | When set to `"true"`, enables `productionBrowserSourceMaps: true` if not already set in `next.config`.                          |
| `PORT`                           | Runtime (`serve.js`) | HTTP port for the server. Cloud Run always sets it; defaults to `3000` when unset.                                              |
| `KEEP_ALIVE_TIMEOUT`             | Runtime (`serve.js`) | Optional HTTP server `keepAliveTimeout` in milliseconds.                                                                        |
