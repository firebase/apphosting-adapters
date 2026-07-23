import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CategoryReelComponent } from './category-reel.component';
import { Category } from '../../../../models';
import { fetchApiMockProvider } from '../../../shared/utils/fetch-mock-provider.test-util';

describe('CategoryReelComponent', () => {
  let component: CategoryReelComponent;
  let fixture: ComponentFixture<CategoryReelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryReelComponent],
      providers: [provideRouter([]), fetchApiMockProvider],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryReelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('category', new Category({}));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
