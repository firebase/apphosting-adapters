import { inject, Injectable, DOCUMENT } from '@angular/core';
import { WINDOW } from '@ngx-templates/shared/services';
import { EditorSelection } from './editor-selection';

/**
 * Provides an API for managing text selection within the web page context.
 *
 * The service is not bound to the actual editor textarea.
 */
@Injectable()
export class SelectionManager {
  private _win = inject(WINDOW);
  private _doc = inject(DOCUMENT);
  private _selectionCache: EditorSelection | null = null;

  private get _selection(): EditorSelection {
    if (this._selectionCache) {
      return this._selectionCache;
    }
    return this._createEditorSelection();
  }

  text(): string {
    return this._selection.toString().trim();
  }

  range() {
    return this._selection.getRange();
  }

  position(): { x: number; y: number } {
    const range = this._selection.getRange();

    if (!range) {
      return { x: -1, y: -1 };
    }

    const rect = range.getBoundingClientRect();
    return {
      x: rect.x + rect.width,
      y: rect.y + rect.height,
    };
  }

  updateText(text: string) {
    this.updateNode(this._doc.createTextNode(text));
  }

  updateNode(node: Node) {
    const range = this._selection.getRange();

    if (!range) {
      return;
    }

    range.deleteContents();
    range.insertNode(node);

    this._selectNodeContents(node);
  }

  insertText(text: string) {
    const range = this._selection.getRange();
    const textNode = this._doc.createTextNode(text);
    range?.insertNode(textNode);

    // Set the caret to the end of the inserted text
    const newRange = this._doc.createRange();
    newRange.setStart(textNode, text.length);

    // Unmemoization required
    this.unmemoize();
    const selection = this._win.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(newRange);
  }

  memoize() {
    this._selectionCache = this._createEditorSelection();
  }

  unmemoize() {
    this._selectionCache = null;
  }

  deselect() {
    this._win.getSelection()?.removeAllRanges();
  }

  private _createEditorSelection() {
    const selection = this._win.getSelection();
    const range =
      (selection?.rangeCount || 0) > 0 ? selection?.getRangeAt(0) : undefined;

    return new EditorSelection(range, selection?.toString() || '');
  }

  private _selectNodeContents(node: Node) {
    const range = this._doc.createRange();
    const firstChild = node.firstChild;
    const lastChild = node.lastChild;

    // If we have multiple children, we should
    // select all of them. We can easily achieve
    // this by providing the parent (node) element.
    // However, this breaks our formatting detection
    // since the Range.parentElement will not be the
    // updated element but most likely the editor
    // container.
    if (firstChild && lastChild) {
      range.setStart(firstChild, 0);
      range.setEnd(lastChild, lastChild.textContent?.length || 0);
    } else {
      // If there are no children, i.e. a single text node,
      // select it directly.
      range.selectNodeContents(node);
    }

    // Since we use the window.selection directly,
    // we unmemoize in case we have a saved selection.
    this.unmemoize();
    const selection = this._win.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}
