# AI Text Editor Angular app template

AI-powered editor that provides text enhancement tools and supports basic formatting.

The template has an implemented state management and API layer, plus a mocked API for demonstration purposes. It can be disabled from `app.config.ts`. This way, the template will perform network calls to your specified API URL set in `environment/`. Note that API-s already have a predefined design that can be explored both at the API layers or the mocks. Your API should follow that design or, alternatively, update the template API layer so that it suits your specific needs.

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```
