import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MODAL_DATA,
  ModalContentComponent,
  ModalController,
  ModalService,
} from '@ngx-templates/shared/modal';

import { WidgetItemComponent } from './widget-item/widget-item.component';
import { WidgetComponent } from '../widgets/widget.component';
import {
  WidgetConfigData,
  WidgetConfigModalComponent,
  WidgetConfigResponse,
} from './widget-config-modal/widget-config-modal.component';
import { WidgetType } from '../widgets/widget';
import { STORE_WIDGETS } from './store-widgets';

export type WidgetStoreResponse = {
  widgetType: WidgetType;
  dataSourceId: string;
  title: string;
  size: number;
};

@Component({
  selector: 'db-widgets-store-modal',
  imports: [ModalContentComponent, WidgetItemComponent, WidgetComponent],
  templateUrl: './widgets-store-modal.component.html',
  styleUrl: './widgets-store-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetsStoreModalComponent {
  data = inject(MODAL_DATA) as string;
  ctrl: ModalController<WidgetStoreResponse> = inject(ModalController);
  private _modalsService = inject(ModalService);

  widgets = STORE_WIDGETS;

  onWidgetClick(widgetType: WidgetType) {
    const idx = STORE_WIDGETS.findIndex((i) => i.type === widgetType);

    this._modalsService
      .createModal<
        WidgetConfigData,
        WidgetConfigResponse
      >(WidgetConfigModalComponent, STORE_WIDGETS[idx])
      .closed.then((resp) => {
        if (resp) {
          this.ctrl.close({
            widgetType,
            dataSourceId: resp.dataSourceId,
            title: resp.title,
            size: resp.size,
          });
        }
      });
  }
}
