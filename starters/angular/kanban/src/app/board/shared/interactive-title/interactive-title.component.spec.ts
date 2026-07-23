import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideWindow } from '@ngx-templates/shared/services';

import { InteractiveTitleComponent } from './interactive-title.component';

describe('InteractiveTitleComponent', () => {
  let component: InteractiveTitleComponent;
  let fixture: ComponentFixture<InteractiveTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractiveTitleComponent],
      providers: [provideWindow()],
    }).compileComponents();

    fixture = TestBed.createComponent(InteractiveTitleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', '');
    fixture.componentRef.setInput('title', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
