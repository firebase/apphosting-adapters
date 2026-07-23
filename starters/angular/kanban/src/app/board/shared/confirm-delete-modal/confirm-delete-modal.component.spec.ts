import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { List } from 'immutable';
import { MODAL_DATA, ModalController } from '@ngx-templates/shared/modal';

import { ConfirmDeleteModalComponent } from './confirm-delete-modal.component';

describe('ConfirmDeleteModalComponent', () => {
  let component: ConfirmDeleteModalComponent;
  let fixture: ComponentFixture<ConfirmDeleteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteModalComponent],
      providers: [
        {
          provide: MODAL_DATA,
          useValue: {
            entity: '',
          },
        },
        {
          provide: ModalController,
          useValue: new ModalController(0, signal(List())),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
