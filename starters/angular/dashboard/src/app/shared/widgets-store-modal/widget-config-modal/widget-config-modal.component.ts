import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  MODAL_DATA,
  ModalContentComponent,
  ModalController,
} from '@ngx-templates/shared/modal';
import { SELECTOR_COMPONENTS } from '@ngx-templates/shared/selector';
import { ButtonComponent } from '@ngx-templates/shared/button';

import { DATA_SOURCES } from '../../../data/sources';
import { DataSourceType } from '../../../data/types';

export type WidgetConfigData = {
  supportedSizes: number[];
  supportedDataSource: string;
};

export type WidgetConfigResponse = {
  size: number;
  dataSourceId: string;
  title: string;
};

const SRC_TYPE_NAME: { [key in DataSourceType]: string } = {
  [DataSourceType.List]: 'List',
  [DataSourceType.SingleValued]: 'Single-valued',
  [DataSourceType.Tabular]: 'Tabular',
};

@Component({
  selector: 'db-widget-config-modal',
  imports: [ButtonComponent, ModalContentComponent, SELECTOR_COMPONENTS],
  templateUrl: './widget-config-modal.component.html',
  styleUrl: './widget-config-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetConfigModalComponent {
  data = inject(MODAL_DATA) as WidgetConfigData;
  ctrl: ModalController<WidgetConfigResponse> = inject(ModalController);

  SRC_TYPE_NAME = SRC_TYPE_NAME;

  sources = DATA_SOURCES.filter(
    (src) => this.data.supportedDataSource === src.type,
  );

  titleInput = viewChild.required<ElementRef>('titleInput');
  dataSourceId = signal<string>('');
  size = signal<string>('');

  iterate = (size: number) => new Array(size);

  selectedSourceName = computed(
    () => DATA_SOURCES.find((ds) => ds.id === this.dataSourceId())?.name,
  );

  addWidget() {
    const supportedSizes = this.data.supportedSizes;
    // If the supported size is only one,
    // the size signal will remain empty.
    const size =
      supportedSizes.length === 1
        ? supportedSizes[0]
        : parseInt(this.size(), 10);

    this.ctrl.close({
      dataSourceId: this.dataSourceId(),
      size,
      title: this.titleInput().nativeElement.value,
    });
  }
}
