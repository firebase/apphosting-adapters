import { TestBed } from '@angular/core/testing';
import { fetchApiMockProvider } from '../../shared/utils/fetch-mock-provider.test-util';
import { ImagesService } from './images.service';

describe('ImagesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [fetchApiMockProvider, ImagesService],
    });
  });

  it('should load images into the list', async () => {
    const images = TestBed.inject(ImagesService);

    expect(images.list().size).toEqual(0);
    expect(images.totalSize()).toEqual(0);

    await images.loadImages();

    expect(images.list().size).toBeGreaterThan(0);
    expect(images.totalSize()).toBeGreaterThan(0);
  });

  it('should mark the list as complete, if all images are loaded', async () => {
    const images = TestBed.inject(ImagesService);

    expect(images.isComplete()).toEqual(false);

    await images.loadImages();

    expect(images.isComplete()).toEqual(true);
  });

  it('should load an image in the preview map', async () => {
    const images = TestBed.inject(ImagesService);

    expect(images.previewImages().size).toEqual(0);

    await images.loadImageForPreview(1);

    expect(images.previewImages().get(1)).toBeDefined();
  });
});
