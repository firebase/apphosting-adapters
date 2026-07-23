import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Image } from '../../../../shared/image';

const THUMB_WIDTH = 300;

@Component({
  selector: 'ig-image',
  imports: [NgOptimizedImage],
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent {
  image = input.required<Image>();
  index = input.required<number>();
  priority = input<boolean>(false);
  imageClick = output<{ index: number }>();

  // Modify according to your image CDN along with the `NgOptimizedImage`
  src = computed(() => {
    const src = this.image().src.split('.').shift();

    if (!src) {
      return this.image().src;
    }
    return src + '-' + THUMB_WIDTH + 'w.webp';
  });

  size = computed(() => ({
    width: THUMB_WIDTH,
    height: Math.round(
      THUMB_WIDTH * (this.image().height / this.image().width),
    ),
  }));

  metadata = computed(() => this.image().metadata || {});
}
