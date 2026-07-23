import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCardInputComponent } from './new-card-input.component';

describe('NewCardInputComponent', () => {
  let component: NewCardInputComponent;
  let fixture: ComponentFixture<NewCardInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCardInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewCardInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
