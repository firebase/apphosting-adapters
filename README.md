[service-worker.js](https://github.com/user-attachments/files/31294306/service-worker.js)
[rizvi-data.js](https://github.com/user-attachments/files/31294305/rizvi-data.js)
[rizvi-app.js](https://github.com/user-attachments/files/31294304/rizvi-app.js)
[real-employees.js](https://github.com/user-attachments/files/31294300/real-employees.js)
[README.md](https://github.com/user-attachments/files/31294299/README.md)
[manifest.json](https://github.com/user-attachments/files/31294298/manifest.json)
[index.html](https://github.com/user-attachments/files/31294297/index.html)
[firestore.indexes.json](https://github.com/user-attachments/files/31294289/firestore.indexes.json)
[firebase-config.js](https://github.com/user-attachments/files/31294287/firebase-config.js)
[firebase-app.js](https://github.com/user-attachments/files/31294286/firebase-app.js)
[firebase.json](https://github.com/user-attachments/files/31294284/firebase.json)

[DEPLOY.md](https://github.com/user-attachments/files/31294270/DEPLOY.md)


[README.md](https://github.com/user-attachments/files/31294258/README.md)
[service-worker.js](https://github.com/user-attachments/files/31294255/service-worker.js)
[rizvi-data.js](https://github.com/user-attachments/files/31294254/rizvi-data.js)
[rizvi-app.js](https://github.com/user-attachments/files/31294253/rizvi-app.js)
[real-employees.js](https://github.com/user-attachments/files/31294244/real-employees.js)

[deploy.yml](https://github.com/user-attachments/files/31294212/deploy.yml)
<img width="512" height="512" alt="icon-512" src="https://github.com/user-attachments/assets/40ffe5cd-091b-427e-8331-ce7f29fcf31c" />
<img width="192" height="192" alt="icon-192" src="https://github.com/user-attachments/assets/c395abd5-0c54-4feb-8226-6a41e58b85c1" />
<img width="512" height="512" alt="icon" src="https://github.com/user-attachments/assets/b7364d86-d526-4a57-aee9-3c7ff936dad6" />
<img width="32" height="32" alt="favicon" src="https://github.com/user-attachments/assets/fec17ae8-1598-4f94-a64e-f754f11c4eac" />
<img width="180" height="180" alt="apple-touch-icon" src="https://github.com/user-attachments/assets/865776f7-1933-4247-abc7-074a37bebfef" />
[README.md](https://github.com/user-attachments/files/31294189/README.md)
[README (2).md](https://github.com/user-attachments/files/31294183/README.2.md)
[README (1).md](https://github.com/user-attachments/files/31294181/README.1.md)
# App Hosting adapters

## Overview

App Hosting provides configuration-free build and deploy support for Web apps developed in these frameworks:

* Next.js 13+
* Angular 17.2+

This repo holds the code for the adapters that enable support for these frameworks. At a high level these adapters transform framework specific configurations into an [output bundle spec](#app-hosting-output-bundle) that App Hosting can use to configure frameworks support. For more information see [Framework integration](https://firebase.google.com/docs/app-hosting/about-app-hosting#frameworks).

## App Hosting output bundle

The App Hosting output bundle is a file based specification that allows different frameworks to configure and customize their App Hosting deployment for enhanced support.

Any framework that can generate a build output in accordance with the App Hosting output bundle can be deployed on App Hosting.

The output bundle primarily consists of a `bundle.yaml` file that sits inside of the `.apphosting` directory. This bundle.yaml contains all the ways that frameworks can configure App Hosting when users deploy their applications.

> [!NOTE]  
> App Hosting technically supports all node applications, but no custom framework features will be enabled without the output bundle.

## Output bundle Schema

The output bundle is contained in a single file:

```shell
.apphosting/bundle.yaml
```

As long as this file exists and follows the schema, App Hosting will be able to process the build properly.

The schema can also be found in [source](https://github.com/FirebaseExtended/firebase-framework-tools/blob/main/packages/%40apphosting/common/src/index.ts#L4)

```typescript
interface OutputBundle {
  version: "v1"
  runConfig: RunConfig;
  metadata: Metadata;
  outputFiles?: OutputFiles;
}
```

### Version

The `version` represents which output bundle version is currently being used. The current version is v1.

### RunConfig

The `runConfig` fields configures the Cloud Run service associated with the App Hosting Backend.

```typescript
interface RunConfig {
  runCommand: string;
  environmentVariables?: EnvVarConfig[];
  concurrency?: number;
  cpu?: number;
  memoryMiB?: number;
  minInstances?: number;
  maxInstances?: number;
}
```

| Field  | Type | Description | Required? |
| ---------- | ------- | - | - |
| `runCommand` | `string` |Command to start the server (e.g. `node dist/index.js`). Assume this command is run from the root dir of the workspace. This should be the productionized version of the server start command. | y |
| `environmentVariables`| `EnvVarConfig[]` | Environment variables present in the server execution environment.| n |
| `concurrency` | `number` | The maximum number of concurrent requests that each server instance can receive.| n |
| `cpu` | `number` |The number of CPUs used in a single server instance. | n |
| `memoryMiB` | `number` | The amount of memory available for a server instance.| n |
| `minInstance` | `number` |The limit on the minimum number of function instances that may coexist at a given time. | n |
| `MaxInstance` | `number` | The limit on the maximum number of function instances that may coexist at a given time.| n |

Many of these fields are shared with `apphosting.yaml`. See the [runConfig reference documentation](https://firebase.google.com/docs/reference/apphosting/rest/v1beta/projects.locations.backends.builds#runconfig) for additional context and default values.

### EnvVarConfig

```typescript
interface EnvVarConfig {
  variable: string;
  value: string;
  availability: 'RUNTIME'
}

```

| Field  | Type | Description | Required? |
| ---------- | ------- | - | - |
| `variable` | `string` |Name of the environment variable | y |
| `value` | `string` |Value associated with the environment variable | y |
| `availability` | `RUNTIME` | Where the variable will be available. For now this will always be `RUNTIME` | y |

### Metadata

```typescript
interface Metadata {
  adapterPackageName: string;
  adapterVersion: string;
  framework: string;
  frameworkVersion?: string;
}

```

| Field  | Type | Description | Required? |
| ---------- | ------- | - | - |
| `adapterPackageName` | `string` |Name of the adapter (this should be the npm package name) | y |
| `adapterVersion`| `string` | Version of the adapter | y |
| `framework` | `string` | Name of the framework that is being supported | y |
| `frameworkVersion` | `string` |Version of the framework that is being supported | n |

### OutputFiles

OutputFiles is an optional field to configure outputFiles and optimize server files + static assets.

```typescript
interface OutputFiles {
  serverApp: ServerApp
}

```

| Field  | Type | Description | Required? |
| ---------- | ------- | - | - |
| `serverApp` | `ServerApp` | ServerApp holds configurations related to the serving files at runtime from Cloud Run | y |

### ServerApp

OutputFiles is an optional field to configure outputFiles and optimize server files + static assets.

```typescript
interface ServerApp {
  include:  string[]
}

```

| Field  | Type | Description | Required? |
| ---------- | ------- | - | - |
| `include` | `string[]` | include holds a list of directories + files relative to the app root dir that frameworks need to deploy to the App Hosting server, generally this will be the output/dist directory (e.g. .output or dist). In the case that the framework wants to include all files they can use [“.”] | y |

## Sample

Here is a sample `.apphosting/bundle.yaml` file putting all this together:

```yaml
version: v1
runConfig:
  runCommand: node dist/index.js
  environmentVariables:
    - variable: VAR
      value: 8080
      availability: RUNTIME
  concurrency: 80
  cpu: 2
  memoryMiB: 512
  minInstances: 0
  maxInstances: 14

outputFiles:
  serverApp:
    include: 
      - dist
      - .output
    
metadata:
  adapterPackageName: npm-name
  adapterVersion: 12.0.0
  framework: framework-name
  frameworkVersion: 1.0.0
```

As long as you have the `bundle.yaml` in this format, App Hosting will be able to deploy any framework that supports server side rendering.
