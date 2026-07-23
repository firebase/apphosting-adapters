import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  DOCUMENT,
} from '@angular/core';
import { DRAG_AND_DROP_DIRECTIVES } from '@ngx-templates/shared/drag-and-drop';
import { ButtonComponent } from '@ngx-templates/shared/button';
import { ModalService } from '@ngx-templates/shared/modal';
import { ToastsService } from '@ngx-templates/shared/toasts';
import { WINDOW } from '@ngx-templates/shared/services';
import { generateShortUUID } from '@ngx-templates/shared/utils';
import { Map } from 'immutable';

import { WidgetComponent } from '../widgets/widget.component';
import {
  WidgetStoreResponse,
  WidgetsStoreModalComponent,
} from '../widgets-store-modal/widgets-store-modal.component';
import { GridStoreService } from './grid-store.service';
import { WidgetGridItem } from './widget-grid-item';

const DESKTOP_GRID_COLS = 4;
const MOBILE_GRID_COLS = 1;
const MOBILE_UI_MAX_WIDTH = 800;
const WIN_RESIZE_DEBOUNCE = 100; // ms

@Component({
  selector: 'db-widgets-grid',
  imports: [WidgetComponent, ButtonComponent, DRAG_AND_DROP_DIRECTIVES],
  providers: [GridStoreService],
  templateUrl: './widgets-grid.component.html',
  styleUrl: './widgets-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetsGridComponent {
  doc = inject(DOCUMENT);
  private _win = inject(WINDOW);
  private _modalService = inject(ModalService);
  private _gridStore = inject(GridStoreService);
  private _toasts = inject(ToastsService);

  private _resizeTimeout?: ReturnType<typeof setTimeout>;

  private _widgets = signal<Map<string, WidgetGridItem>>(Map([]));
  editMode = signal<boolean>(false);
  widgets = computed(() => this._widgets().toList());
  widgetsLoaded = signal<boolean>(false);
  columns = signal<number>(DESKTOP_GRID_COLS);

  constructor() {
    const widgets = this._gridStore.getGridItems();
    this._widgets.set(widgets);
    this._updateGridColumns();

    effect(() => {
      this._gridStore.setGridItems(this._widgets());
    });

    // Mark widgets as loaded on the browser
    afterNextRender({ read: () => this.widgetsLoaded.set(true) });
  }

  @HostListener('window:resize')
  onWinResize() {
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
    }
    this._resizeTimeout = setTimeout(() => {
      // Change the number of columns based on the window width
      this._updateGridColumns();
    }, WIN_RESIZE_DEBOUNCE);
  }

  addWidget() {
    this._modalService
      .createModal<void, WidgetStoreResponse>(WidgetsStoreModalComponent)
      .closed.then((resp) => {
        if (resp) {
          const { widgetType, size, dataSourceId, title } = resp;
          const id = generateShortUUID();

          this._widgets.update((map) =>
            map.set(
              id,
              new WidgetGridItem({
                id,
                position: map.size,
                type: widgetType,
                config: { style: 'gold' },
                dataSourceId,
                title,
                size,
              }),
            ),
          );

          this._toasts.create('Widget successfully added!', { ttl: 2500 });
        }
      });
  }

  removeWidget(id: string) {
    this._widgets.update((m) => m.delete(id));
  }

  onWidgetMoved({ affected }: { affected: { id: string; pos: number }[] }) {
    this._widgets.update((widgets) => {
      for (const { id, pos } of affected) {
        widgets = widgets.set(id, widgets.get(id)!.set('position', pos));
      }
      return widgets;
    });
  }

  private _updateGridColumns() {
    const cols =
      this._win.innerWidth > MOBILE_UI_MAX_WIDTH
        ? DESKTOP_GRID_COLS
        : MOBILE_GRID_COLS;

    this.columns.set(cols);
  }
}
