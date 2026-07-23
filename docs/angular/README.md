# App Hosting Angular Adapter

Official Angular support for Firebase App Hosting.

### Versions supported

| Version | Status | Deprecation           |
|---------|--------|-----------------------|
| 18.2.x  | lts    | 2026-10-9             |
| 19.0.x  | active | not before 2025-10-9  |
| 19.1.x  | active | not before 2025-10-9  |
| 19.2.x  | active | -                     |

[See Firebase App Hosting's runtime support policy](https://firebase.google.com/docs/app-hosting/frameworks-tooling#runtimes-for-app-hosting) for more information.

## Known limitations

* **I18n:** While core I18n functionality works, direct navigation to SSR pages can result in errors.
* **Localization:** Building versions for different locales isn't supported.
* **Builders:** Only the Application builder is currently supported.
* **Environments and Monorepo Tooling:** Angular projects that have more than a single application target will fail. For more complete monorepo support, use Nx.

[See Firebase App Hosting's FAQ and troubleshooting documentation](https://firebase.google.com/docs/app-hosting/troubleshooting) for up-to-date information on the current limitations of the platform.