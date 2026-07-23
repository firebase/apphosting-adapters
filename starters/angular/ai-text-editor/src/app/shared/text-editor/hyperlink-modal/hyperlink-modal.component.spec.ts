import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ngx-templates/shared/modal';
import { List } from 'immutable';

import { HyperlinkModalComponent } from './hyperlink-modal.component';

describe('HyperlinkModalComponent', () => {
  let component: HyperlinkModalComponent;
  let fixture: ComponentFixture<HyperlinkModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HyperlinkModalComponent],
      providers: [
        {
          provide: ModalController,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          useValue: new ModalController(0, signal<List<any>>(List([]))),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HyperlinkModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
