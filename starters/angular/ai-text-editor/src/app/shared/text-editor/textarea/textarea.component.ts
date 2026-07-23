import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SafeHtmlPipe } from '@ngx-templates/shared/utils';
import { SelectionManager } from '../selection-manager.service';

export class TextareaController {
  constructor(private _textarea: TextareaComponent) {}

  clear() {
    if (this._textarea.contents()) {
      this._textarea.contents.set('');
    } else {
      // Special case – if the content is empty (e.g. typing in in a new doc),
      // setting it again to an empty string will not clear the textarea (no change).
      // That's why, we have to do this manually by altering the actual HTML.
      this._textarea.editor().nativeElement.innerHTML = '';
    }
  }
}

@Component({
  selector: 'ate-textarea',
  imports: [SafeHtmlPipe],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaComponent implements AfterViewInit {
  private _selection = inject(SelectionManager);

  private _contentsInit: boolean = false;
  private _focused: boolean = false;
  private _mouseLock: boolean = false;
  private _storedSelection = '';
  private _lastSelection = '';

  editor = viewChild.required<ElementRef>('editor');

  /**
   * Provide the parent editor wrapper element.
   * Default: Direct parent.
   */
  parent = input<HTMLElement | null>(null);

  /**
   * Format controls (references) that are outside
   * of the textarea.
   *
   * If they aren't provided, clicking on them
   * won't preserve the focus and selected text.
   */
  formatCtrls = input<Set<HTMLElement>>(new Set());

  textSelect = output<string>();
  input = output<string>();
  ref = output<HTMLElement>();
  ctrl = output<TextareaController>();

  contents = signal<string>('');

  /**
   * Textarea initial contents.
   */
  // We don't want to update unnecessarily the textarea
  // on each contents signal update. This is why we are
  // guarding against it.
  @Input()
  set initContents(v: string) {
    if (!this._contentsInit) {
      this.contents.set(v);
      this._contentsInit = true;
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.editor().nativeElement.focus();
    });

    this.ref.emit(this.editor().nativeElement);
    this.ctrl.emit(new TextareaController(this));
  }

  onFocus() {
    this._focused = true;
  }

  onBlur() {
    this._focused = false;
  }

  onMousedown() {
    this._mouseLock = true;
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseup(e: MouseEvent) {
    this._mouseLock = false;

    const target = e.target as HTMLElement;
    const ctrls = this.formatCtrls();

    // If a formatting control has been clicked,
    // don't emit an empty string since this will
    // break consecutive selection formatting.
    if (
      !ctrls.has(target) &&
      target.parentElement &&
      !ctrls.has(target.parentElement)
    ) {
      this.textSelect.emit(this._storedSelection);
    }

    this._storedSelection = '';
  }

  @HostListener('document:selectionchange')
  onDocumentSelectionChange() {
    if (!this._focused) {
      return;
    }

    const selection = this._selection.text();

    if (this._mouseLock) {
      this._storedSelection = selection;
    } else if (selection !== this._lastSelection) {
      this.textSelect.emit(selection);
    }
    this._lastSelection = selection;
  }

  @HostListener('document:contextmenu')
  onDocumentCtxMenu() {
    this._mouseLock = false;
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentTabPress(e: KeyboardEvent) {
    // Handle Tab press
    if (this._focused && e.key === 'Tab') {
      e.preventDefault();

      this._selection.insertText('\u2003');
      const html = this.editor().nativeElement.innerHTML;
      this.input.emit(html);
    }
  }

  // Strips text from any formatting on paste
  onPaste(e: ClipboardEvent) {
    if (!e.clipboardData) {
      return;
    }
    e.preventDefault();

    const text = e.clipboardData.getData('text/plain');

    if (this._selection.text()) {
      this._selection.updateText(text);
    } else {
      this._selection.insertText(text);
    }

    const html = this.editor().nativeElement.innerHTML;
    this.input.emit(html);
  }
}
