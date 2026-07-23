import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  Renderer2,
  signal,
} from '@angular/core';
import { ModalService } from '@ngx-templates/shared/modal';
import { IconComponent } from '@ngx-templates/shared/icon';
import { ToastsService, ToastType } from '@ngx-templates/shared/toasts';
import { WINDOW } from '@ngx-templates/shared/services';

import { ConfirmClearModalComponent } from './confirm-clear-modal/confirm-clear-modal.component';
import { AiEnhancerMenuComponent } from './ai-enhancer-menu/ai-enhancer-menu.component';
import {
  FormatEvent,
  FormattingBarComponent,
} from './formatting-bar/formatting-bar.component';
import {
  TextareaComponent,
  TextareaController,
} from './textarea/textarea.component';

import { DocStoreService } from './doc-store.service';
import { SelectionManager } from './selection-manager.service';
import { FormattingService, TextStyle } from './formatting.service';
import { ExportService } from './export.service';

const AUTOSAVE_DEBOUNCE = 2000;
const HINT_TTL = 7500;

// Minimal required length for the AI Enhancer to activate
const MIN_AI_ENHC_STR_LEN = 5;

@Component({
  selector: 'ate-text-editor',
  imports: [
    TextareaComponent,
    AiEnhancerMenuComponent,
    FormattingBarComponent,
    IconComponent,
  ],
  providers: [
    DocStoreService,
    SelectionManager,
    FormattingService,
    ExportService,
  ],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditorComponent {
  private _modal = inject(ModalService);
  private _selection = inject(SelectionManager);
  private _formatting = inject(FormattingService);
  private _toasts = inject(ToastsService);
  private _export = inject(ExportService);
  private _renderer = inject(Renderer2);
  private _win = inject(WINDOW);
  docStore = inject(DocStoreService);

  private _inputTimeout!: ReturnType<typeof setTimeout>;
  private _hintCooldown: boolean = false;
  private _textareaCtrl?: TextareaController;

  isTextSelected = signal<boolean>(false);
  showSavedLabel = signal<boolean>(false);
  showAiEnhancer = signal<boolean>(false);
  editorDirty = signal<boolean>(false);
  aiEnhancerPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  formatCtrls = signal<Set<HTMLElement>>(new Set());

  async onFormat(e: FormatEvent) {
    switch (e.command) {
      case 'bold':
        this._formatting.toggleBold();
        break;
      case 'italic':
        this._formatting.toggleItalics();
        break;
      case 'underlined':
        this._formatting.toggleUnderlined();
        break;
      case 'hyperlink':
        await this._formatting.addHyperlink();
        break;
      case 'text-style':
        this._formatting.changeTextStyle(e.parameter as TextStyle);
        break;
    }

    this.onInput();
    this.showAiEnhancer.set(false);
  }

  download() {
    const htmlFile = this._export.exportAsHtml();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const url = (this._win as any).URL.createObjectURL(htmlFile);

    const anchor = this._renderer.createElement('a') as HTMLAnchorElement;
    this._renderer.setAttribute(anchor, 'href', url);
    this._renderer.setAttribute(anchor, 'download', 'document.html');
    anchor.click();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._win as any).URL.revokeObjectURL(url);
  }

  clearDocument() {
    this._modal
      .createModal<void, boolean>(ConfirmClearModalComponent)
      .closed.then((shouldClear: boolean | undefined) => {
        if (shouldClear) {
          this._textareaCtrl?.clear();
          this.docStore.clear();
          this.editorDirty.set(false);
        }
      });
  }

  async showHint() {
    if (this._hintCooldown) {
      return;
    }

    this._hintCooldown = true;

    await this._toasts.create(
      'Select the text that you want to modify in order to activate the AI Enhancer',
      {
        ttl: HINT_TTL,
        type: ToastType.Notification,
        icon: 'Lightbulb',
      },
    );
    this._hintCooldown = false;
  }

  onInput() {
    if (this._inputTimeout) {
      clearTimeout(this._inputTimeout);
    }

    this.showSavedLabel.set(false);
    this.editorDirty.set(true);

    this._inputTimeout = setTimeout(() => {
      this.docStore.save();
      this.showSavedLabel.set(true);
    }, AUTOSAVE_DEBOUNCE);
  }

  onTextSelect(text: string) {
    // Show the enhancer, if the selection length is sufficient
    if (text.length >= MIN_AI_ENHC_STR_LEN) {
      const { x, y } = this._selection.position();

      this.showAiEnhancer.set(true);
      this.aiEnhancerPos.set({ x, y });
    } else {
      this.showAiEnhancer.set(false);
    }

    this.isTextSelected.set(!!text.length);
  }

  onAiEnhance() {
    this.showAiEnhancer.set(false);
    this.onInput();
  }

  @HostListener('document:mousedown')
  onDocumentClick() {
    this.showAiEnhancer.set(false);
  }

  onTextareaControllerInit(ctrl: TextareaController) {
    this._textareaCtrl = ctrl;
  }
}
