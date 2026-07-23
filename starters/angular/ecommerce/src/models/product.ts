import { List, Record } from 'immutable';

/**
 * Product Parameter
 */

interface ProductParameterConfig {
  name: string;
  value: string;
}

const productParameterRecord = Record<ProductParameterConfig>({
  name: '',
  value: '',
});

export class ProductParameter extends productParameterRecord {
  constructor(config: ProductParameterConfig) {
    super(config);
  }
}

/**
 * Product
 */

// Note(Georgi): Think about a "isComplete" flag
interface ProductConfig {
  id: string;
  name: string;
  description: string;
  categoryIds: List<string>;
  images: List<string>;
  price: number;
  discountPrice: number;
  availability: 'none' | 'low' | 'normal';
  parameters: List<ProductParameter>;
}

const productRecord = Record<ProductConfig>({
  id: '',
  name: '',
  description: '',
  categoryIds: List([]),
  images: List([]),
  price: 0,
  discountPrice: 0,
  availability: 'normal',
  parameters: List([]),
});

export class Product extends productRecord {
  constructor(config: Partial<ProductConfig>) {
    super(config);
  }
}
