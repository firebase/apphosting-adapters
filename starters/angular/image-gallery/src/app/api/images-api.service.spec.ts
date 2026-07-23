import { TestBed } from '@angular/core/testing';
import { fetchApiMockProvider } from '../shared/utils/fetch-mock-provider.test-util';
import { ImagesApi } from './images-api.service';
import { Image } from '../shared/image';

describe('ImagesApi', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [fetchApiMockProvider, ImagesApi],
    });
  });

  it('should fetch a single image', async () => {
    const imagesApi = TestBed.inject(ImagesApi);
    const image = await imagesApi.getImage(0);

    expect(image instanceof Image).toBeTruthy();
    expect(image.src).toEqual('images/img-0.jpg');
  });

  it('should fetch multiple images', async () => {
    const imagesApi = TestBed.inject(ImagesApi);
    const response = await imagesApi.getImages({
      pageSize: 4,
      page: 1,
    });

    expect(response.images.map((p) => p instanceof Image)).toBeTruthy();
    expect(response.images.size).toEqual(4);
  });
});
