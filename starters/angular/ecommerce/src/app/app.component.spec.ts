import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { CategoriesService } from './data-access/categories.service';
import { CartService } from './data-access/cart.service';
import { fetchApiMockProvider } from './shared/utils/fetch-mock-provider.test-util';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        fetchApiMockProvider,
        CategoriesService,
        CartService,
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
