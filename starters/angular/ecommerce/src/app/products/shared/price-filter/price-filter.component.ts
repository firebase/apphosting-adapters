import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  viewChild,
  DOCUMENT,
} from '@angular/core';

export type PriceRange = {
  from: number;
  to: number;
};

@Component({
  selector: 'ec-price-filter',
  imports: [],
  templateUrl: './price-filter.component.html',
  styleUrl: './price-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceFilterComponent {
  private _doc = inject(DOCUMENT);

  fromInput = viewChild.required<ElementRef>('fromInput');
  toInput = viewChild.required<ElementRef>('toInput');

  default = input.required<PriceRange>();
  range = model<PriceRange>({ from: 0, to: 0 });

  // Blur inputs on Enter press
  @HostListener('document:keypress', ['$event'])
  onKeyPress(e: KeyboardEvent) {
    if (e.code === 'Enter') {
      const activeEl = this._doc.activeElement;

      if (this.fromInput().nativeElement === activeEl) {
        this.fromInput().nativeElement.blur();
      } else if (this.toInput().nativeElement === activeEl) {
        this.toInput().nativeElement.blur();
      }
    }
  }

  onFromChangeEnd(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    let from = Math.max(this.default().from, value);
    from = Math.min(from, this.range().to);

    this.range.update((r) => ({
      ...r,
      from,
    }));
  }

  onToChangeEnd(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    let to = Math.min(value, this.default().to);
    to = Math.max(this.range().from, to);

    this.range.update((r) => ({
      ...r,
      to,
    }));
  }
}
