import {
  Directive,
  HostListener,
  LOCALE_ID,
  OnChanges,
  Renderer2,
  SimpleChanges,
  inject,
  input,
  DOCUMENT,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DataItem } from '../../../data/types';
import { List } from 'immutable';

type Pos = { x: number; y: number };

const CURSOR_MARGIN = 15;

/**
 * Adds a tooltip functionality to an element when hovered
 * by a provided `DataItem` via the default input.
 */
@Directive({
  selector: '[dbWidgetTooltip]',
})
export class WidgetTooltipDirective implements OnChanges {
  private _doc = inject(DOCUMENT);
  private _locale = inject(LOCALE_ID);
  private _renderer = inject(Renderer2);

  private _decimalPipe = new DecimalPipe(this._locale);
  private _widget?: HTMLDivElement;

  data = input.required<DataItem | List<DataItem>>({
    alias: 'dbWidgetTooltip',
  });
  private _prevData?: DataItem | List<DataItem>;

  /**
   * An array of colors that corresponds to the data values.
   */
  tooltipColors = input<string[]>([]);

  /**
   * Secondary value/label rendered under the main value.
   * Use paired with a single `DataItem`.
   */
  tooltipSecondaryVal = input<string>();

  ngOnChanges(changes: SimpleChanges): void {
    this._prevData = changes['data'].previousValue;
  }

  @HostListener('mouseenter', ['$event'])
  onMouseEnter({ clientX, clientY }: MouseEvent) {
    const pos = { x: clientX, y: clientY };

    // Create a new HTML element only if there is reason to do so. Else, re-position.
    if (!this._widget || (this._prevData && this._prevData !== this.data())) {
      this._widget = this._createWidget(pos);
    } else {
      this._positionElement(this._widget, pos);
    }

    this._doc.body.appendChild(this._widget);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove({ clientX, clientY }: MouseEvent) {
    if (this._widget) {
      this._positionElement(this._widget, { x: clientX, y: clientY });
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this._widget) {
      this._doc.body.removeChild(this._widget);
    }
  }

  /**
   * Creates the HTML tooltip element along with the corresponding data.
   */
  private _createWidget(pos: Pos) {
    const widget = this._renderer.createElement('div') as HTMLDivElement;
    this._renderer.addClass(widget, 'db-widget-tooltip');
    this._positionElement(widget, pos);

    const data = this.data();

    if (data instanceof DataItem) {
      this._createDataItem(widget, data);
    } else {
      data.forEach((di, i) => this._createDataItem(widget, di, i));
    }

    return widget;
  }

  private _createDataItem(
    widget: HTMLDivElement,
    item: DataItem,
    index?: number,
  ) {
    const { label, value, unit } = item;

    // Create the label element
    const labelEl = this._renderer.createElement('p');
    this._renderer.addClass(labelEl, 'db-widget-tooltip__label');

    // Add a color to the label, if available
    if (index !== undefined && this.tooltipColors()[index]) {
      const coloredDot = this._renderer.createElement('span');
      this._renderer.setStyle(
        coloredDot,
        'background-color',
        this.tooltipColors()[index],
      );
      this._renderer.addClass(coloredDot, 'db-widget-tooltip__label__dot');
      labelEl.appendChild(coloredDot);
    }

    // Create and append the label text
    const labelText = this._renderer.createElement('span');
    labelText.innerText = label;
    labelEl.appendChild(labelText);

    // Create the value container
    const valueEl = this._renderer.createElement('p');
    this._renderer.addClass(valueEl, 'db-widget-tooltip__value');
    valueEl.innerText = this._decimalPipe.transform(value) + ' ' + unit;

    widget.appendChild(labelEl);
    widget.appendChild(valueEl);

    // Add a secondary value, if any
    if (this.tooltipSecondaryVal()) {
      const secValEl = this._renderer.createElement('p');
      this._renderer.addClass(secValEl, 'db-widget-tooltip__sec-value');
      secValEl.innerText = this.tooltipSecondaryVal();
      widget.appendChild(secValEl);
    }
  }

  private _positionElement(target: HTMLElement, pos: Pos) {
    const x = pos.x + CURSOR_MARGIN;
    const y = pos.y + CURSOR_MARGIN;

    const translate = 'translate(' + x + 'px, ' + y + 'px)';

    this._renderer.setStyle(target, 'transform', translate);
  }
}
