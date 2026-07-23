import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

const DEFAULT_LINES_COUNT = 3;

@Component({
  selector: 'acb-query-skeleton',
  imports: [],
  templateUrl: './query-skeleton.component.html',
  styleUrl: './query-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuerySkeletonComponent {
  /**
   * Number of visualized lines.
   */
  lines = input<number>(DEFAULT_LINES_COUNT);

  /**
   * Hide sender visualization and show only the lines.
   */
  linesOnly = input<boolean>(false);

  linesArr = computed(() => new Array(this.lines()).fill(null));
}
