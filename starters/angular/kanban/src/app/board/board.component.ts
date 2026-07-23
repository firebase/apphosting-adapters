import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  DRAG_AND_DROP_DIRECTIVES,
  DragEvent,
  MovedEvent,
} from '@ngx-templates/shared/drag-and-drop';
import { ModalService } from '@ngx-templates/shared/modal';
import { WINDOW } from '@ngx-templates/shared/services';

import { provideBoardState } from './data-access/board-state.provider';
import { BoardService } from './data-access/board.service';
import { ListsService } from './data-access/lists.service';
import { CardsService } from './data-access/cards.service';
import { LabelsService } from './data-access/labels.service';

import { ListComponent } from './shared/list/list.component';
import { CardComponent } from './shared/card/card.component';
import { AddListComponent } from './shared/add-list/add-list.component';
import {
  CardDetailsComponent,
  CardDetailsData,
} from './shared/card-details/card-details.component';
import { RoutePrefix } from '../route-prefixes';

// The size of the active area where the auto
// scroll is activated.
const HSCRL_ACTIVE_AREA = 50;

// The size of the maximal scroll step (in pixels)
// that can be reached during scroll.
const HSCRL_STEP = 10;

// The speed of the scroll is based on how deep
// inside the active area the mouse cursor is
// (continuous interval [0-1]). This constant
// controls how big the step size can become.
// Along with HSCRL_STEP, they determine how
// fast the auto scroll is.
const HSCRL_MAX_SPEED = 0.5;

@Component({
  selector: 'kb-board',
  imports: [
    ListComponent,
    CardComponent,
    DRAG_AND_DROP_DIRECTIVES,
    AddListComponent,
  ],
  providers: [
    provideBoardState(),
    BoardService,
    ListsService,
    CardsService,
    LabelsService,
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit {
  lists = inject(ListsService);
  cards = inject(CardsService);

  private _board = inject(BoardService);
  private _location = inject(Location);
  private _modal = inject(ModalService);
  private _injector = inject(Injector);
  private _route = inject(ActivatedRoute);
  private _win = inject(WINDOW);

  wrapper = viewChild.required<ElementRef>('wrapper');
  disabledSpacerListId = signal<string>('');

  private _scrollInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this.openCard(id, false);
    }
    this._board.loadBoardData();
  }

  openCard(cardId: string, animated: boolean = true) {
    this._location.go(RoutePrefix.Card + '/' + cardId);
    this._modal
      .createModal<CardDetailsData>(
        CardDetailsComponent,
        {
          cardId,
        },
        // Since the outlet is located in the AppComponent
        // but we need the state services, we must provide
        // the current injector.
        { injector: this._injector, animated },
      )
      .closed.then(() => {
        this._location.go('/');
      });
  }

  onCardMoved(listId: string, e: MovedEvent) {
    this.cards.updateCardPosition(e.id, { listId, pos: e.pos });
  }

  onCardDrag(e: DragEvent) {
    if (e.state === 'move' && e.pos) {
      // Reusing the ngx-drop-grid drag events.
      // Slight downside – we are working with the card center
      // position instead of the actual mouse coordinates
      // which should be fine.
      this._scrollHorizontallyOnDrag(e.pos);
    }
  }

  disabledSpacerFor(listId: string, enabled: boolean) {
    if (enabled) {
      this.disabledSpacerListId.set(listId);
    } else {
      this.disabledSpacerListId.set('');
    }
  }

  /**
   * Horizontal auto scroll handler activated during drag.
   */
  private _scrollHorizontallyOnDrag(cardCenter: { x: number; y: number }) {
    if (this._scrollInterval) {
      clearInterval(this._scrollInterval);
    }

    const xLeft = cardCenter.x;
    const xRight = this._win.innerWidth - cardCenter.x;
    const dLeft = HSCRL_ACTIVE_AREA - xLeft;
    const dRight = HSCRL_ACTIVE_AREA - xRight;
    const el = this.wrapper().nativeElement;
    const scrolled = Math.ceil(el.clientWidth + el.scrollLeft);

    if (dLeft >= 0 && el.scrollLeft > 0) {
      const speed = Math.min(dLeft / HSCRL_ACTIVE_AREA, HSCRL_MAX_SPEED);
      this._scrollInterval = setInterval(() => {
        el.scrollTo(el.scrollLeft - HSCRL_STEP * speed, 0);
      });
    } else if (dRight >= 0 && el.scrollWidth > scrolled) {
      const speed = Math.min(dRight / HSCRL_ACTIVE_AREA, HSCRL_MAX_SPEED);
      this._scrollInterval = setInterval(() => {
        el.scrollTo(el.scrollLeft + HSCRL_STEP * speed, 0);
      });
    }
  }
}
