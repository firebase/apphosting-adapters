import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideWindow } from '@ngx-templates/shared/services';

import { ListComponent } from './list.component';
import { CardsService } from '../../data-access/cards.service';
import { fetchApiMockAndStateProvider } from '../../../shared/utils/fetch-mock-provider.test-util';
import { ListsService } from '../../data-access/lists.service';
import { BoardList } from '../../../../models';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [
        fetchApiMockAndStateProvider,
        provideWindow(),
        CardsService,
        ListsService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('list', new BoardList({}));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
