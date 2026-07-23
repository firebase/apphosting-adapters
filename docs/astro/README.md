# App Hosting Astro Adapter

Experimental support for Astro on Firebase App Hosting, [see the work-in-progress here](https://github.com/FirebaseExtended/firebase-framework-tools/pull/297).

## Instructions for use

To use follow these instructions:

1. Install the `@apphosting/astro-adapter` Astro adapter with the following command in your terminal:
`npx astro add @apphosting/astro-adapter`
1. Add the adapter with the standalone rendering mode to your astro.config.* file:

```js
import { defineConfig } from 'astro/config';
import node from '@apphosting/astro-adapter';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
});
```

1. Push the changes to github and kickoff a new rollout

> **Experimental:** While this adapter was built by Google employees, it is not currently an official Google Cloud product. Support is best-effort only.
