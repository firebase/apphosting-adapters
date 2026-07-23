import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonComponent } from '@ngx-templates/shared/button';
import { ToastsService } from '@ngx-templates/shared/toasts';
import { WINDOW } from '@ngx-templates/shared/services';

import { GeminiApi } from '../../../api/gemini-api.service';
import { SelectionManager } from '../selection-manager.service';

type EnhancerState = 'standby' | 'user-prompt' | 'loading' | 'ready';
type EnhancerOp = 'formalize' | 'expand' | 'use-as-prompt' | 'user-prompt';

const SELECTION_MARGIN = 10;
const VIEWPORT_PADDING = 24; // 12 on each side

@Component({
  selector: 'ate-ai-enhancer-menu',
  imports: [ButtonComponent, ReactiveFormsModule],
  templateUrl: './ai-enhancer-menu.component.html',
  styleUrl: './ai-enhancer-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiEnhancerMenuComponent implements OnDestroy, AfterViewInit {
  private _selection = inject(SelectionManager);
  private _formBuilder = inject(FormBuilder);
  private _gemini = inject(GeminiApi);
  private _toasts = inject(ToastsService);
  private _elRef = inject(ElementRef);
  private _renderer = inject(Renderer2);
  private _win = inject(WINDOW);

  promptInput = viewChild<ElementRef>('promptInput');

  enhance = output<void>();

  userPromptForm = this._formBuilder.group({
    prompt: ['', [Validators.required, Validators.minLength(3)]],
  });

  position = input.required<{ x: number; y: number }>();
  state = signal<EnhancerState>('standby');
  output = signal<string>('');

  private _lastOperation?: EnhancerOp;

  constructor() {
    effect(() => {
      if (this.state() === 'user-prompt') {
        // Focus the prompt input when rendered
        this.promptInput()?.nativeElement.focus();
      }
    });

    effect(() => {
      // Update enhancer position on `position` change
      this._updateElementPos();
    });
  }

  ngAfterViewInit() {
    const observer = new ResizeObserver((entries) => {
      const entry = entries.pop();
      if (entry) {
        this._updateElementPos();
      }
    });

    observer.observe(this._elRef.nativeElement);
  }

  ngOnDestroy() {
    // Unmemoize in case we have memoized the selection but
    // the enhancer is closed/destroyed for some reason.
    this._selection.unmemoize();
  }

  async formalize() {
    this.state.set('loading');
    this._lastOperation = 'formalize';

    const text = this._selection.text();
    const output = await this._gemini.generate(
      'Formalize the following text directly, without formatting',
      text,
    );

    this.output.set(output);
    this.state.set('ready');
  }

  async expand() {
    this.state.set('loading');
    this._lastOperation = 'expand';

    const text = this._selection.text();
    const output = await this._gemini.generate(
      'Expand the following text directly, without formatting',
      text,
    );

    this.output.set(output);
    this.state.set('ready');
  }

  async useAsPrompt() {
    this.state.set('loading');
    this._lastOperation = 'use-as-prompt';

    const text = this._selection.text();
    const output = await this._gemini.generate(text);

    this.output.set(output);
    this.state.set('ready');
  }

  activateUserPrompt() {
    this.state.set('user-prompt');
    this._selection.memoize();
  }

  async executeUserPrompt() {
    this.state.set('loading');
    this._lastOperation = 'user-prompt';

    const prompt = this.userPromptForm.get('prompt')?.value as string;
    const text = this._selection.text();
    const output = await this._gemini.generate(prompt, text);

    this.output.set(output);
    this.state.set('ready');
  }

  retry() {
    if (!this._lastOperation) {
      return;
    }

    switch (this._lastOperation) {
      case 'formalize':
        this.formalize();
        break;
      case 'expand':
        this.expand();
        break;
      case 'user-prompt':
        this.executeUserPrompt();
        break;
      case 'use-as-prompt':
        this.useAsPrompt();
        break;
    }
  }

  replaceSelection() {
    this._selection.updateText(this.output());
    this._selection.deselect();
    this._selection.unmemoize();

    this.output.set('');
    this.state.set('standby');
    this.enhance.emit();

    this._toasts.create('Selection replaced!', { ttl: 3000 });
  }

  private _updateElementPos() {
    let { x, y } = this.position();
    const el = this._elRef.nativeElement;

    const width = this._elRef.nativeElement.offsetWidth;
    const height = this._elRef.nativeElement.offsetHeight;
    const maxX =
      this._win.innerWidth - width - SELECTION_MARGIN - VIEWPORT_PADDING;
    const maxY = this._win.innerHeight - height - SELECTION_MARGIN;

    x = Math.min(x, maxX);
    y = Math.min(y, maxY) + this._win.scrollY;

    this._renderer.setStyle(el, 'top', y + SELECTION_MARGIN + 'px');
    this._renderer.setStyle(el, 'left', x + SELECTION_MARGIN + 'px');
  }
}
