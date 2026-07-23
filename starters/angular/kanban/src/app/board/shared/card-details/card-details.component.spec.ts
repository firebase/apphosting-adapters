import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { List } from 'immutable';

import { MODAL_DATA, ModalController } from '@ngx-templates/shared/modal';
import { provideWindow } from '@ngx-templates/shared/services';

import { CardDetailsComponent } from './card-details.component';
import { CardsService } from '../../data-access/cards.service';
import { fetchApiMockAndStateProvider } from '../../../shared/utils/fetch-mock-provider.test-util';
import { LabelsService } from '../../data-access/labels.service';

describe('CardDetailsComponent', () => {
  let component: CardDetailsComponent;
  let fixture: ComponentFixture<CardDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDetailsComponent],
      providers: [
        fetchApiMockAndStateProvider,
        provideWindow(),
        {
          provide: MODAL_DATA,
          useValue: {
            cardId: '',
          },
        },
        {
          provide: ModalController,
          useValue: new ModalController(0, signal(List())),
        },
        CardsService,
        LabelsService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CardDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
