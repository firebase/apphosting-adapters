import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MODAL_DATA, ModalController } from '@ngx-templates/shared/modal';

import { WidgetConfigModalComponent } from './widget-config-modal.component';
import { signal } from '@angular/core';
import { List } from 'immutable';

describe('WidgetConfigModalComponent', () => {
  let component: WidgetConfigModalComponent;
  let fixture: ComponentFixture<WidgetConfigModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetConfigModalComponent],
      providers: [
        {
          provide: MODAL_DATA,
          useValue: {
            supportedSizes: [],
            supportedDataSource: '',
          },
        },
        {
          provide: ModalController,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          useValue: new ModalController(0, signal<List<any>>(List([]))),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetConfigModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
