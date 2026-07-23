import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetItemComponent } from './widget-item.component';

describe('WidgetItemComponent', () => {
  let component: WidgetItemComponent;
  let fixture: ComponentFixture<WidgetItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('type', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
