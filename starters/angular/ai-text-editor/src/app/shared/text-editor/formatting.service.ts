import { inject, Injectable, DOCUMENT } from '@angular/core';
import { SelectionManager } from './selection-manager.service';

import { ModalService } from '@ngx-templates/shared/modal';
import { HyperlinkModalComponent } from './hyperlink-modal/hyperlink-modal.component';

export type TextStyle = 'heading' | 'monospaced' | 'body';

const applyInlineFormatting = (fmtEl: HTMLElement, fmtClass: string) => {
  fmtEl.classList.add(fmtClass);
  fmtEl.classList.remove('x-' + fmtClass);
};

const removeInlineFormatting = (fmtEl: HTMLElement, fmtClass: string) => {
  fmtEl.classList.add('x-' + fmtClass);
  fmtEl.classList.remove(fmtClass);
};

/**
 * Applies formatting on the current text selection.
 *
 * Not bound to the actual editor textarea.
 */
@Injectable()
export class FormattingService {
  private _selection = inject(SelectionManager);
  private _doc = inject(DOCUMENT);
  private _modals = inject(ModalService);

  toggleBold() {
    this._formatSelection(
      (fmtEl) => applyInlineFormatting(fmtEl, 'bd'),
      (fmtEl) => removeInlineFormatting(fmtEl, 'bd'),
      (fmtEl) => fmtEl.classList.contains('bd'),
    );
  }

  toggleItalics() {
    this._formatSelection(
      (fmtEl) => applyInlineFormatting(fmtEl, 'it'),
      (fmtEl) => removeInlineFormatting(fmtEl, 'it'),
      (fmtEl) => fmtEl.classList.contains('it'),
    );
  }

  toggleUnderlined() {
    this._formatSelection(
      (fmtEl) => applyInlineFormatting(fmtEl, 'ul'),
      (fmtEl) => removeInlineFormatting(fmtEl, 'ul'),
      (fmtEl) => fmtEl.classList.contains('ul'),
    );
  }

  changeTextStyle(style: TextStyle) {
    switch (style) {
      case 'heading':
        this._formatSelection(
          (fmtEl) => {
            fmtEl.classList.remove('mono');
            fmtEl.classList.add('hd');
          },
          () => {},
          (fmtEl) => fmtEl.classList.contains('hd'),
        );
        break;

      case 'monospaced':
        this._formatSelection(
          (fmtEl) => {
            fmtEl.classList.add('mono');
          },
          () => {},
          (fmtEl) => fmtEl.classList.contains('mono'),
        );
        break;

      case 'body':
        this._formatSelection(
          (fmtEl) => fmtEl.classList.remove('hd', 'mono'),
          () => {},
          () => false,
        );
        break;
    }
  }

  addHyperlink() {
    this._selection.memoize();

    return this._modals
      .createModal<void, string>(HyperlinkModalComponent)
      .closed.then((url: string | undefined) => {
        if (url && url.length) {
          this._formatSelection(
            (fmtEl) => {
              const anchor = this._doc.createElement('a');
              anchor.href = url;
              anchor.target = '_blank';
              anchor.title = 'Opens ' + url;
              anchor.innerHTML = fmtEl.innerText;

              fmtEl.contentEditable = 'false';
              fmtEl.innerHTML = '';
              fmtEl.appendChild(anchor);

              fmtEl.classList.add('ach');
            },
            (fmtEl) => {
              fmtEl.innerHTML = fmtEl.innerText;
            },
            (fmtEl) => fmtEl.classList.contains('ach'),
          );
        }

        this._selection.unmemoize();
      });
  }

  private _formatSelection(
    formatElement: (el: HTMLElement) => void,
    unformatElement: (el: HTMLElement) => void,
    formattedElementTest: (el: HTMLElement) => boolean,
  ) {
    const range = this._selection.range();
    if (!range) {
      return;
    }

    const text = this._selection.text();
    const startCont = range.startContainer;
    const endCont = range.endContainer;

    const isSameParent = startCont.parentElement === endCont.parentElement;
    const isCompleteSelectedData = startCont.parentElement?.innerText === text;
    const isFmtElement = startCont.parentElement?.classList.contains('fmt');

    // Is current selection wrapper in a fmtElement from end to end
    const isWrapperInFmtElement =
      isSameParent && isCompleteSelectedData && isFmtElement;

    let fmtElement = startCont.parentElement!;

    // If not in fmtElement, wrap it
    if (!isWrapperInFmtElement) {
      fmtElement = this._doc.createElement('span');
      fmtElement.classList.add('fmt');
      fmtElement.setAttribute('data-id', Date.now().toString());
      fmtElement.innerText = text;

      this._selection.updateNode(fmtElement);
    }

    // Apply or remove formatting
    if (!formattedElementTest(fmtElement)) {
      formatElement(fmtElement);
    } else {
      unformatElement(fmtElement);
    }
  }
}
