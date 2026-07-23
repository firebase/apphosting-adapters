# App Hosting Next.js Adapter

Official Next.js support for Firebase App Hosting.

## Versions supported

| Version | Status | Deprecation           |
|---------|--------|-----------------------|
| 13.5.x  | lts    | 2026-10-9             |
| 14.2.x  | lts    | 2026-10-9             |
| 15.0.x  | active | not before 2025-10-9  |
| 15.1.x  | active | not before 2025-10-9  |
| 15.2.x  | active | -                     |

[See Firebase App Hosting's runtime support policy](https://firebase.google.com/docs/app-hosting/frameworks-tooling#runtimes-for-app-hosting) for more information.

## Known limitations

* By default, the [built-in NextJS image optimization](https://nextjs.org/.docs/app/building-your-application/optimizing/images) is disabled on App Hosting unless you explicitly set [`images.unoptimized`](https://nextjs.org/docs/pages/api-reference/components/image#unoptimized) to false or use a custom [Image Loader.](https://nextjs.org/docs/app/api-reference/config/next-config-js/images#example-loader-configuration) See [Optimize image loading on Next.js](/docs/app-hosting/optimize-image-loading).
* URL paths containing percent-encoded characters are decoded by Cloud Run. This may cause issues with features that expect only encoded URL paths, such as Next.js parallel routing.
* Currently, App Hosting limits the caching for NextJS apps using [middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware). Over time, cache hit rates should improve.
* URL paths containing percent-encoded characters are decoded by Cloud Run. This may cause issues with features that expect only encoded URL paths, such as [Next.js parallel routing](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)

[See Firebase App Hosting's FAQ and troubleshooting documentation](https://firebase.google.com/docs/app-hosting/troubleshooting) for up-to-date information on the current limitations of the platform.