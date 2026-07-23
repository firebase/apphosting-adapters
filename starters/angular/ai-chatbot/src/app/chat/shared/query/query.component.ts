import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { SafeHtmlPipe } from '@ngx-templates/shared/utils';
import { IconComponent } from '@ngx-templates/shared/icon';

import { Query } from '../../../../model';
import { QuerySkeletonComponent } from '../query-skeleton/query-skeleton.component';

@Component({
  selector: 'acb-query',
  imports: [SafeHtmlPipe, IconComponent, QuerySkeletonComponent],
  templateUrl: './query.component.html',
  styleUrl: './query.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryComponent implements AfterViewInit {
  private _elRef = inject(ElementRef);

  query = input.required<Query>();
  isNew = input<boolean>();

  ngAfterViewInit() {
    // Scroll into the view newly created queries.
    if (this.isNew()) {
      this._elRef.nativeElement.scrollIntoView();
    }
  }
}
