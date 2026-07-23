import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  IMAGE_LOADER,
  ImageLoaderConfig,
  NgOptimizedImage,
} from '@angular/common';

import { Product } from '../../../models';
import { environment } from '../../../environments/environment';
import { IconComponent } from '@ngx-templates/shared/icon';
import { BREAKPOINT_SIZE, ScreenBreakpoint } from '../utils/screen-breakpoints';

type ImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xlg';

const DEFAULT_ALT = 'Product Image';

const SIZE_TO_WIDTH: { [key in ImageSize]: number } = {
  xs: 32,
  sm: 64,
  md: 160,
  lg: 320,
  xlg: 480,
};

// Currently, our mocked data supports only x1 and x2 densities.
const SUPPORTED_PIXEL_DENSITIES = [1, 2];

const buildUrl = (baseSrc: string, width: number | undefined) => {
  let src = '';
  if (!width) {
    src = baseSrc;
  } else {
    const parts = baseSrc.split('.');
    const extension = parts.pop();
    src = `${parts.join('')}-${width}w.${extension}`;
  }

  return environment.imageCdnUrl + src;
};

// The current provider is set to work with the mocked images.
//
// Use the default `provideImgixLoader`, if your CDN uses
// the standard `?w={size}` query paramter sizing query.
const imageLoaderProvider = {
  provide: IMAGE_LOADER,
  useValue: (config: ImageLoaderConfig) => buildUrl(config.src, config.width),
};

const buildMediaQuery = (bp: ScreenBreakpoint) =>
  `(max-width: ${BREAKPOINT_SIZE[bp]}px)`;

const buildSrcset = (src: string, size: ImageSize) =>
  SUPPORTED_PIXEL_DENSITIES.map(
    (d) => buildUrl(src, SIZE_TO_WIDTH[size] * d) + ` ${d}x`,
  ).join(', ');

@Component({
  selector: 'ec-product-image',
  imports: [NgOptimizedImage, IconComponent],
  providers: [imageLoaderProvider],
  templateUrl: './product-image.component.html',
  styleUrl: './product-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductImageComponent {
  buildMediaQuery = buildMediaQuery;
  buildSrcset = buildSrcset;

  /**
   * Uses the first image of the product as a source.
   * Overrides 'src', if provided.
   */
  product = input<Product | null>(null);

  /**
   * Static image source.
   */
  src = input<string>('');

  /**
   * Overrides the default alt (Product name or the default text).
   */
  alt = input<string>('');

  /**
   * Provide a single size value (i.e. `xs`, `sm`, `md`, `lg` or `xlg`) or
   * a comma-separated list of descriptors in the form of `<ImageSize> <ScreenBreakpoint>`
   * for responsive image loading (e.g. `sm 600w, md` – "if the size of the viewport is
   * below `600w` use a _small_ image variant; use a _medium_ image in all other cases").
   *
   * The `ec-product-image` container should still be resized with CSS.
   *
   * Check `screen-breakpoints.ts` for the breakpoints values.
   *
   * _Not to be confused with `HTMLImageElement.sizes` property._
   */
  size = input<string>('sm');

  /**
   * Use if the img is the LCP element.
   */
  priority = input<boolean>(false);

  baseSrc = computed<string>(
    () => (this.product() ? this.product()?.images.first() : this.src()) || '',
  );

  sizes = computed<[ImageSize, ScreenBreakpoint][]>(
    () =>
      this.size()
        .split(',')
        .map((v) => v.trim().split(' '))
        .filter(([, bp]) => !!bp) as [ImageSize, ScreenBreakpoint][],
  );

  defaultSize = computed(
    () => SIZE_TO_WIDTH[this.size().split(',').pop()?.trim() as ImageSize],
  );

  altText = computed(() => {
    if (this.alt()) {
      return this.alt();
    }
    if (this.product()) {
      return this.product()?.name || DEFAULT_ALT;
    }
    return DEFAULT_ALT;
  });
}
