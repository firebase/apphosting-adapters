import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  Renderer2,
  viewChild,
} from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'kb-new-card-input',
  imports: [],
  templateUrl: './new-card-input.component.html',
  styleUrl: './new-card-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewCardInputComponent implements AfterViewInit {
  private _renderer = inject(Renderer2);

  env = environment;

  textarea = viewChild<ElementRef>('textarea');

  cardCreate = output<string>();
  cardBlur = output<void>();
  cardInput = output<void>();

  ngAfterViewInit() {
    this.textarea()?.nativeElement.focus();
  }

  onTextareaInput() {
    this._autoSize();
    this.cardInput.emit();
  }

  onTextareaKeydown(e: KeyboardEvent) {
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
    }
  }

  @HostListener('document:keydown.enter')
  onEnterPress() {
    this._createCard();
    this.textarea()?.nativeElement.blur();
  }

  private _createCard() {
    const title = this.textarea()?.nativeElement.value.trim();
    if (title) {
      this.cardCreate.emit(title);
    }
  }

  private _autoSize() {
    const textarea = this.textarea()?.nativeElement;
    this._renderer.setStyle(textarea, 'height', null);

    const filler = 5; // Fixes jankiness during typing
    const height = textarea.scrollHeight + filler;
    this._renderer.setStyle(textarea, 'height', height + 'px');
  }
}
