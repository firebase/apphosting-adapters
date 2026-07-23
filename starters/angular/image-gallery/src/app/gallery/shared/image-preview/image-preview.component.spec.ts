import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MODAL_DATA, ModalController } from '@ngx-templates/shared/modal';

import { ImagePreviewComponent } from './image-preview.component';
import { signal } from '@angular/core';
import { List, Map } from 'immutable';

describe('ImagePreviewComponent', () => {
  let component: ImagePreviewComponent;
  let fixture: ComponentFixture<ImagePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagePreviewComponent],
      providers: [
        {
          provide: MODAL_DATA,
          useValue: {
            imageIdx: 0,
            imagesService: {
              totalSize: signal(0),
              isComplete: signal(false),
              previewImages: signal(Map([])),
              list: signal(List([])),
              loadImageForPreview: () => {},
            },
          },
        },
        {
          provide: ModalController,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImagePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
