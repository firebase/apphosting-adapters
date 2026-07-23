import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandableContComponent } from './expandable-cont.component';

describe('ExpandableContComponent', () => {
  let component: ExpandableContComponent;
  let fixture: ComponentFixture<ExpandableContComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandableContComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpandableContComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
