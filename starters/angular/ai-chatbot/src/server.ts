import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Converter } from 'showdown';
import { GoogleGenerativeAI } from '@google/generative-ai';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Gemini API implementation
 */

app.use(express.json());

// Assign your Google AI API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env['API_KEY'] || '');
const ctx = new Map();

// Used for converting MD => HTML.
const converter = new Converter();

function printRequestData(req: express.Request) {
  const prompt = req.body.prompt;
  const execTime = new Date();
  console.log(
    `\x1b[34m[${execTime.toDateString()} ${execTime.toLocaleTimeString()}]\x1b[0m`,
    `POST ${req.path}; Prompt: ${prompt || '<<EMPTY>>'}`,
  );
}

app.post('/api/gemini', async (req, res) => {
  let model = ctx.get(req.path);
  if (!model) {
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    ctx.set(req.path, model);
  }

  printRequestData(req);
  const prompt = req.body.prompt;

  if (!prompt) {
    res.json({ output: '' });
  } else {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = await response.text();
    res.json({ output });
  }
});

app.post('/api/gemini-chat', async (req, res) => {
  let chat = ctx.get(req.path);
  if (!chat) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Hello' }],
        },
        {
          role: 'model',
          parts: [{ text: 'Great to meet you. What would you like to know?' }],
        },
      ],
    });

    ctx.set(req.path, chat);
  }

  printRequestData(req);
  const prompt = req.body.prompt;

  if (!prompt) {
    res.json({ output: '' });
  } else {
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const md = await response.text();
    const output = converter.makeHtml(md);
    res.json({ output });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
