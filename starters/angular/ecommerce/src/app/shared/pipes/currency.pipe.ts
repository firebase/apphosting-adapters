import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe as NgCurrencyPipe } from '@angular/common';

import { environment } from '../../../environments/environment';

/**
 * A shorthand (wrapper/extension) of the default currency pipe
 * with predefined currency based on the environment.
 */
@Pipe({
  name: 'currency',
})
export class CurrencyPipe extends NgCurrencyPipe implements PipeTransform {
  // We need to override all of the method
  // signatures that use `value`.
  override transform(value: number | string): string | null;
  override transform(value: null | undefined): null;
  override transform(value: number | string | null | undefined): string | null {
    return super.transform(value, environment.currency, 'symbol-narrow');
  }
}
