// Must execute before any require('react') or Next server imports.
(process.env as Record<string, string | undefined>).NODE_ENV = "production";
