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
- **Build cache pruning ()**: Sets `experimental.turbopackFileSystemCacheForBuild = false` unless explicitly configured by the user, preventing ~48 MiB of uncached `.next/cache` bloat in container layers.
- **Browser source maps**: Sets `productionBrowserSourceMaps: true` only when `CRASHLYTICS_UPLOAD_MAPPING=true` and `config.productionBrowserSourceMaps` is unset.

### `onBuildComplete(ctx)`

Writes four files under `<repoRoot>/.cloudrun/` (`bundle.yaml` is written last via atomic temp-file write + `fs.renameSync` so its presence guarantees a complete bundle):

| File                          | Description                                                                                                                                                                           |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.cloudrun/package.json`      | `{"type": "commonjs"}` — ensures Node treats `.cloudrun/serve.js` as CommonJS even when the repository root `package.json` sets `"type": "module"`.                                   |
| `.cloudrun/serve.js`          | Pre-bundled CommonJS entry point (bundles `@next/routing`) that enforces the in-process SSR / Server Action guard (`serve-guard`) before delegating to Next's standalone `server.js`. |
| `.cloudrun/next-routing.json` | Version 1 routing manifest consumed by `.cloudrun/serve.js` at runtime.                                                                                                               |
| `.cloudrun/bundle.yaml`       | Version `v2` Cloud Run web bundle manifest consumed by the `webnextjs` buildpack and image pruner (`pkg/webbundle`).                                                                  |

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

- Contains `version: 1`, `nextVersion`, `adapterVersion`, `buildId`, `outputMode`, `projectDir`, `distDir`, `serverDir`, `basePath`, `trailingSlash`, `i18n`, `routing`, `middleware`, `prerenders`, `pathnames`, and `edgeOutputs`.
- **Fail-closed middleware matching ()**: Strips `has` and `missing` conditions from `routing.middlewareMatchers` and `middleware.matchers` so conditional `proxy.ts` / `middleware.ts` matchers cannot be bypassed by static path checks.
- **Secret scrubbing ()**: Never copies `prerenderManifest.preview` secrets (`previewModeId`, `previewModeSigningKey`, `previewModeEncryptionKey`), `bypassToken`, or internal `x-prerender-revalidate` / `__prerender_bypass` conditions.
- **Size discipline ()**: Drops internal `.rsc` and `.segments/*` flight duplicates and `/_next/static/*` chunk entries from `routes`, `prerenders`, and `pathnames`.

---

## Environment Variables

| Variable                         | Phase                | Description                                                                                                                     |
| :------------------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_ADAPTER_PATH`              | Build (`next build`) | Absolute path to `@google-cloud/adapter-nextjs` (`dist/index.js`) used by Next.js to load the adapter.                          |
| `NEXT_PRIVATE_OUTPUT_TRACE_ROOT` | Build (`next build`) | Repository/workspace root (`/workspace` on Cloud Run). Used as `repoRoot` for relative paths and `.cloudrun/` output placement. |
| `CRASHLYTICS_UPLOAD_MAPPING`     | Build (`next build`) | When set to `"true"`, enables `productionBrowserSourceMaps: true` if not already set in `next.config`.                          |
| `PORT`                           | Runtime (`serve.js`) | HTTP port for the standalone server (defaults to `8080`).                                                                       |
| `KEEP_ALIVE_TIMEOUT`             | Runtime (`serve.js`) | Optional HTTP server `keepAliveTimeout` in milliseconds.                                                                        |
| `CLOUD_RUN_OPTIMIZE_SSR`         | Runtime (`serve.js`) | Controls `serve-guard` enforcement mode (`"false"` / `"dry-run"` / enabled by default).                                         |
