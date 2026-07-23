import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import {
  COLOR_NAMES_MAP,
  LABEL_COLORS,
} from '../../../../label-coloring/label-colors';

@Component({
  selector: 'kb-color-picker',
  imports: [],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true,
    },
  ],
})
export class ColorPickerComponent implements ControlValueAccessor {
  private _onChange?: (v: string) => void;
  private _onTouched?: () => void;

  COLORS = LABEL_COLORS;
  NAMES = COLOR_NAMES_MAP;

  value = model<string>();
  disabled = signal<boolean>(false);

  pickColor(key: string) {
    this.writeValue(key);

    if (this._onChange && this._onTouched) {
      this._onChange(key);
      this._onTouched();
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

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  capitalize(name: string) {
    return name[0].toUpperCase() + name.slice(1);
  }
}
