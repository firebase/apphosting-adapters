import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortSelectorComponent } from './sort-selector.component';

describe('SortSelectorComponent', () => {
  let component: SortSelectorComponent;
  let fixture: ComponentFixture<SortSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SortSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
