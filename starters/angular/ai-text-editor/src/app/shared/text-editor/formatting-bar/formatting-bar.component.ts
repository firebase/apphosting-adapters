import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { SELECT_COMPONENTS } from '@ngx-templates/shared/select';
import { IconComponent } from '@ngx-templates/shared/icon';
import { TextStyle } from '../formatting.service';
import { FormatControlDirective } from './format-control.directive';

export type FormatCommandType =
  | 'bold'
  | 'italic'
  | 'underlined'
  | 'hyperlink'
  | 'text-style';

export type FormatEvent = {
  command: FormatCommandType;
  parameter?: string | null;
};

@Component({
  selector: 'ate-formatting-bar',
  imports: [SELECT_COMPONENTS, IconComponent, FormatControlDirective],
  templateUrl: './formatting-bar.component.html',
  styleUrl: './formatting-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormattingBarComponent implements AfterViewInit {
  isTextSelected = input.required<boolean>();
  format = output<FormatEvent>();
  textStyle = signal<TextStyle | null>(null);

  formatCtrls = viewChildren(FormatControlDirective);

  /**
   * Returns a set with all format control HTML elements.
   */
  controlsInit = output<Set<HTMLElement>>();

  ngAfterViewInit() {
    // Emit the rendered format controls
    const ctrlsElements = this.formatCtrls().map((ctrl) => ctrl.nativeElement);
    const ctrlElSet = new Set(ctrlsElements);
    this.controlsInit.emit(ctrlElSet);
  }

  changeTextStyle(style: string | null) {
    this.format.emit({ command: 'text-style', parameter: style });
    setTimeout(() => {
      this.textStyle.set(null);
    });
  }
}
