import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[ateFormatCtrl]',
})
export class FormatControlDirective {
  private _elementRef = inject(ElementRef);

  get nativeElement(): HTMLElement {
    return this._elementRef.nativeElement;
  }
}
