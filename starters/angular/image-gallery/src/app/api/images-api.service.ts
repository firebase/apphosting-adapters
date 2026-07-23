import { Injectable, inject } from '@angular/core';
import { List } from 'immutable';
import { FETCH_API } from '@ngx-templates/shared/fetch';
import { buildQueryParamsString } from '@ngx-templates/shared/utils';

import { environment } from '../../environments/environment';
import { mapImage, mapImages } from './utils/mappers';
import { Image } from '../shared/image';
import { ApiImage } from './utils/api-types';

export type GetImagesParams = Partial<{
  pageSize: number;
  page: number;
}>;

// NOTE: An error handling mechanism is not implemented.
@Injectable({ providedIn: 'root' })
export class ImagesApi {
  private _fetch = inject(FETCH_API);

  /**
   * Fetches images. Supports paging.
   *
   * @returns A list of `Image`-s
   */
  async getImages(
    params?: GetImagesParams,
  ): Promise<{ total: number; images: List<Image> }> {
    const queryParams = buildQueryParamsString({
      pageSize: environment.imagesListPageSize,
      ...params,
    } as GetImagesParams);

    const response = await this._fetch(
      `${environment.apiUrl}/images${queryParams}`,
    );
    const json = (await response.json()) as {
      total: number;
      images: ApiImage[];
    };

    return {
      total: json.total,
      images: mapImages(json.images),
    };
  }

  /**
   * Fetches an image by a provided index
   *
   * @param idx Index of the image
   * @returns An `Image`
   */
  async getImage(idx: number): Promise<Image> {
    const response = await this._fetch(`${environment.apiUrl}/image/${idx}`);
    const json = await response.json();

    return mapImage(json);
  }
}
