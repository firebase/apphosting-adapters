import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconComponent } from '@ngx-templates/shared/icon';
import { ScreenBreakpoint } from '../utils/screen-breakpoints';

/**
 * Expandable container.
 */
@Component({
  selector: 'ec-expandable-cont',
  imports: [IconComponent, CommonModule],
  templateUrl: './expandable-cont.component.html',
  styleUrl: './expandable-cont.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandableContComponent {
  /**
   * Use for enhancing responsiveness.
   *
   * Provide an activation context (e.g. `400w` => will activate, if the screen `max-width: 400w`).
   * The container is active by default. An inactive container will render the
   * content straightaway without expand/collapse functionality.
   *
   * Refer to `_screen-breakpoints.scss` or `screen-breakpoints.ts` for the exact breakpoints sizes.
   */
  activateAt = input<ScreenBreakpoint | null>(null);
  expanded = signal<boolean>(false);

  @HostBinding('class.expanded')
  get isExpanded() {
    return this.expanded();
  }

  toggle() {
    this.expanded.set(!this.expanded());
  }
}
