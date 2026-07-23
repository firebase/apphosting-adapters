import { inject, Injectable } from '@angular/core';
import { DocStoreService } from './doc-store.service';

const htmlFileTemplate = (contents: string): string =>
  `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Document</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 1rem;
          padding: 3rem;
          margin: 0;
          background: #fff;
          color: #000;
        }
        p {
          margin: 0 !important;
        }
        a {
          color: #4882c5;
          text-decoration: underline;
        }
        .bd {
          font-weight: bold;
        }
        .x-bd {
          font-weight: normal;
        }
        .ul {
          text-decoration: underline;
        }
        .it {
          font-style: italic;
        }
        .x-it {
          font-style: normal;
        }
        .hd {
          display: block;
          margin: 2rem 0 0.75rem 0;
          font-size: 2rem;
        }
        .mono {
          display: block;
          font-family: monospace;
          padding: 0.5rem 0.75rem;
          background: #f1f1f1;
          border-radius: 0.2rem;
          margin: 0.375rem 0;
          font-size: 0.875rem;
        }
      </style>
    </head>
    <body>
      ${contents}
    </body>
  </html>
`.replace(/(?:\r\n|\r|\n)/gm, '');

/**
 * Provides an API for exporting the currently
 * saved document (in the `DocStore`).
 */
@Injectable()
export class ExportService {
  private _docStore = inject(DocStoreService);

  exportAsHtml(): File {
    const contents = this._docStore
      .html()
      .replace(/data-id="[0-9]+"/gm, '')
      .replace(/class="fmt\s/gm, 'class="')
      .replace(/contenteditable="false"/gm, '');

    const template = htmlFileTemplate(contents);

    return new File([template], 'document.html', { type: 'text/html' });
  }
}
