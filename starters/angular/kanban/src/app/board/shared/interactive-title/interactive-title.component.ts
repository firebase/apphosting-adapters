import { isPlatformBrowser } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  Renderer2,
  viewChild,
} from '@angular/core';
import { WINDOW } from '@ngx-templates/shared/services';

const DEFAULT_MAX_LENGTH = 50;

@Component({
  selector: 'kb-interactive-title',
  imports: [],
  templateUrl: './interactive-title.component.html',
  styleUrl: './interactive-title.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractiveTitleComponent {
  private _renderer = inject(Renderer2);
  private _win = inject(WINDOW);
  private _platformId = inject(PLATFORM_ID);

  textarea = viewChild.required<ElementRef>('textarea');

  value = input.required<string>();
  title = input.required<string>();
  maxLength = input<number>(DEFAULT_MAX_LENGTH);
  titleBlur = output<string>();

  private _verPadding: number = 0;

  constructor() {
    afterRenderEffect({
      read: () => {
        this._verPadding = this._extractVerPadding();

        // Ensure the height is calculated and set
        // after the value was set.
        if (this.value()) {
          this.setHeight();
        }
      },
    });
  }

  onTextareaBlur() {
    const element = this.textarea().nativeElement;
    const title = element.value.trim();

    if (title) {
      this.titleBlur.emit(title);
      element.value = title;
    } else {
      element.value = this.value();
    }
  }

  onTextareaKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.textarea().nativeElement.blur();
    }
  }

  setHeight() {
    const element = this.textarea().nativeElement;

    // We need to reset the height in order to
    // recalculate the updated scrollHeight.
    this._renderer.setStyle(element, 'height', null);

    const height = element.scrollHeight - this._verPadding;
    this._renderer.setStyle(element, 'height', height + 'px');
  }

  private _extractVerPadding(): number {
    if (!isPlatformBrowser(this._platformId)) {
      return 0;
    }

    const textarea = this.textarea().nativeElement;
    const styles = this._win.getComputedStyle(textarea);
    const paddingTop = parseInt(styles.paddingTop.replace(/px|rem/, ''), 10);

    return paddingTop * 2;
  }
}
