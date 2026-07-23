import { Directive, effect, ElementRef, input, Renderer2 } from '@angular/core';
import { Label } from '../../../../models';
import { LABEL_COLORS } from './label-colors';

const BLACK = '#000';
const WHITE = '#fff';

@Directive({
  selector: '[kbLabelColoring]',
})
export class LabelColoringDirective {
  label = input.required<Label>({ alias: 'kbLabelColoring' });

  constructor({ nativeElement }: ElementRef, renderer: Renderer2) {
    effect(() => {
      const el = nativeElement;
      const color = LABEL_COLORS.get(this.label().color);
      const text = color?.light ? BLACK : WHITE;

      renderer.setStyle(el, 'background-color', color?.hex);
      renderer.setStyle(el, 'color', text);
      renderer.setStyle(el, 'user-select', 'none');
    });
  }
}
