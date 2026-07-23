import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Set } from 'immutable';

import {
  CTX_MENU_DATA,
  CtxMenuController,
} from '@ngx-templates/shared/context-menu';

import { LabelManagerComponent } from './label-manager.component';
import { LabelsService } from '../../../data-access/labels.service';
import { fetchApiMockAndStateProvider } from '../../../../shared/utils/fetch-mock-provider.test-util';
import { CardsService } from '../../../data-access/cards.service';

describe('LabelManagerComponent', () => {
  let component: LabelManagerComponent;
  let fixture: ComponentFixture<LabelManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelManagerComponent],
      providers: [
        fetchApiMockAndStateProvider,
        {
          provide: CtxMenuController,
          useValue: new CtxMenuController(signal(null)),
        },
        {
          provide: CTX_MENU_DATA,
          useValue: {
            cardId: '',
            cardLabelsIds: signal(Set([])),
          },
        },
        LabelsService,
        CardsService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
