import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MODAL_DATA, ModalController } from '@ngx-templates/shared/modal';
import { signal } from '@angular/core';
import { List } from 'immutable';

import { WidgetsStoreModalComponent } from './widgets-store-modal.component';

describe('WidgetsStoreModalComponent', () => {
  let component: WidgetsStoreModalComponent;
  let fixture: ComponentFixture<WidgetsStoreModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetsStoreModalComponent],
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

    fixture = TestBed.createComponent(WidgetsStoreModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
