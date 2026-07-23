import { Injectable, inject, signal } from '@angular/core';
import { List, Map } from 'immutable';

import { environment } from '../../../environments/environment';
import { ImagesApi } from '../../api/images-api.service';
import { Image } from '../../shared/image';

@Injectable()
export class ImagesService {
  private _imageApi = inject(ImagesApi);

  private _isComplete = signal<boolean>(false);
  private _totalSize = signal<number>(0);
  private _list = signal<List<Image>>(List([]));
  private _previewImages = signal<Map<number, Image>>(Map([]));
  private _page = 1;

  list = this._list.asReadonly();
  previewImages = this._previewImages.asReadonly();
  totalSize = this._totalSize.asReadonly();
  isComplete = this._isComplete.asReadonly();

  // Note(Georgi): Review and evaluate
  async loadImageForPreview(idx: number) {
    if (!this._previewImages().has(idx)) {
      let img = this._list().get(idx);
      if (!img) {
        img = await this._imageApi.getImage(idx);
      }

      this._previewImages.update((map) => map.set(idx, img));
    }
  }

  async loadImages() {
    const { images, total } = await this._imageApi.getImages({
      page: this._page,
    });

    this._isComplete.set(images.size < environment.imagesListPageSize);
    this._totalSize.set(total);
    this._list.update((list) => list.concat(images));
    this._page++;
  }
}
