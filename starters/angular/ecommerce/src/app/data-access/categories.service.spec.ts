import { TestBed } from '@angular/core/testing';
import { CategoriesService } from './categories.service';
import { fetchApiMockProvider } from '../shared/utils/fetch-mock-provider.test-util';

describe('CategoriesService', () => {
  let categoriesService: CategoriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [fetchApiMockProvider, CategoriesService],
    });

    categoriesService = TestBed.inject(CategoriesService);
  });

  it('should load categories', async () => {
    await categoriesService.loadCategories();

    expect(categoriesService.categoriesList().size).toBeGreaterThan(0);
  });
});
