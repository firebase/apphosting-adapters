// API response types (JSON)

export type ApiCategory = {
  id: string;
  name: string;
  order: number;
};

export type ApiProduct = {
  id: string;
  name: string;
  description: string;
  category_ids: string[];
  images: string[];
  price: number;
  discount_price: number;
  availability: 'none' | 'low' | 'normal';
  parameters: { name: string; value: string }[];
};
