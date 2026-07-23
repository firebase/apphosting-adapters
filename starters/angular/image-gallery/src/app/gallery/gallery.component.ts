import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ModalService } from '@ngx-templates/shared/modal';
import { InfiniteScrollComponent } from '@ngx-templates/shared/infinite-scroll';

import { ImageMasonryComponent } from './shared/image-masonry/image-masonry.component';
import {
  ImagePreviewComponent,
  ImagePreviewData,
} from './shared/image-preview/image-preview.component';
import { ImagesService } from './shared/images.service';
import { RoutePrefix } from '../route-prefixes';

// Size of the rendered list page. It differs from the API page size.
// Keep smaller from the API page size.
const RENDERED_PAGE_SIZE = 20;

@Component({
  selector: 'ig-gallery',
  imports: [ImageMasonryComponent, InfiniteScrollComponent],
  providers: [ImagesService],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent implements OnInit {
  images = inject(ImagesService);

  private _modals = inject(ModalService);
  private _route = inject(ActivatedRoute);
  private _location = inject(Location);

  private _renderedListPage = signal<number>(1);

  // The rendered list contains all visible/rendered images in the gallery.
  // Rendered List <= Images Service List (API)
  renderedList = computed(() =>
    this.images.list().take(this._renderedListPage() * RENDERED_PAGE_SIZE),
  );

  async ngOnInit() {
    // Load the first page of images
    await this.images.loadImages();

    // Attempt opening an image preview, if a route param is provided
    const idx = parseInt(this._route.snapshot.paramMap.get('idx') || '', 10);

    if (!isNaN(idx) && idx < this.images.totalSize()) {
      this._openImage(idx);
    }
  }

  onImageClick(e: { index: number }) {
    this._location.go(RoutePrefix.Image + '/' + e.index);
    this._openImage(e.index);
  }

  async onLoadNext(loadCompleted: () => void) {
    const nextPage = this._renderedListPage() + 1;
    const newListSize = RENDERED_PAGE_SIZE * nextPage;
    const loadedImagesSize = this.images.list().size;
    const totalSize = this.images.totalSize();

    // If the rendered list exceeds or is equal to the size
    // of the API list, load a new page of images.
    if (newListSize >= loadedImagesSize && totalSize > loadedImagesSize) {
      await this.images.loadImages();
    }

    // Update the rendered list with more already loaded images.
    this._renderedListPage.set(nextPage);

    loadCompleted();
  }

  private _openImage(imageIdx: number) {
    this._modals
      .createModal<ImagePreviewData>(
        ImagePreviewComponent,
        { imageIdx, imagesService: this.images },
        {
          modalWindowUi: false,
        },
      )
      .closed.then(() => {
        this._location.go('/');
      });
  }
}
