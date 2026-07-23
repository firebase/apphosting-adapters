import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '@ngx-templates/shared/icon';

export type InputEvent = {
  message: string;
  complete: () => void;
};

@Component({
  selector: 'acb-chat-input',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputComponent implements AfterViewInit {
  private _renderer = inject(Renderer2);
  private _formBuilder = inject(FormBuilder);

  form = this._formBuilder.group({
    message: ['', [Validators.required, Validators.pattern(/\S+/)]],
  });

  textarea = viewChild.required<ElementRef>('textarea');
  send = output<InputEvent>();
  abort = output<void>();
  processing = signal<boolean>(false);

  ngAfterViewInit() {
    this.focus();
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterPress(e: Event) {
    e.preventDefault();

    this.sendMessage();
  }

  sendMessage() {
    if (this.processing()) {
      return;
    }

    this.processing.set(true);
    const message = this.form.value.message!;

    this.send.emit({
      message,
      complete: () => this.processing.set(false),
    });

    this.form.reset();
    this.focus();
  }

  abortProcessing() {
    this.abort.emit();
    this.focus();
  }

  focus() {
    this.textarea().nativeElement.focus();
  }

  setHeight() {
    const element = this.textarea().nativeElement;

    this._renderer.setStyle(element, 'height', null);
    this._renderer.setStyle(
      element,
      'height',
      element.scrollHeight + 2.5 + 'px', // Needs a push of 2.5px to hide the scrollbar
    );
  }
}
