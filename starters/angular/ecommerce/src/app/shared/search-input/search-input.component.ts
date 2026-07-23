import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// Input debounce time
const INPUT_DEBOUNCE = 250;

@Component({
  selector: 'ec-search-input',
  imports: [],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInputComponent),
      multi: true,
    },
  ],
})
export class SearchInputComponent implements ControlValueAccessor {
  inputRef = viewChild.required<ElementRef>('inputRef');
  value = signal<string>('');
  disabled = signal<boolean>(false);

  focused = output<boolean>();
  placeholder = input<string>('');
  debounce = input<number>(INPUT_DEBOUNCE);

  private _timeout?: ReturnType<typeof setTimeout>;
  private _onChange!: (v: string) => void;
  private _onTouched!: () => void;

  onSearch(e: Event) {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    const update = () => {
      const input = e.target as HTMLInputElement;
      this._onChange(input.value);
      this._onTouched();
    };

    if (this.debounce() > 0) {
      this._timeout = setTimeout(() => update(), this.debounce());
    } else {
      update();
    }
  }

  writeValue(value: string): void {
    this.value.set(value);
  }

  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean) {
    this.disabled.set(isDisabled);
  }
}
