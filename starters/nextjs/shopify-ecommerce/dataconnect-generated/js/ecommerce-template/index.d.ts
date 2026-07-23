import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';
export const connectorConfig: ConnectorConfig;

export type TimestampString = string;

export type UUIDString = string;

export type Int64String = string;

export type DateString = string;


export interface CreateProductData {
  product_insert: Product_Key;
}

export interface CreateProductVariables {
  productID: string;
  productSlug: string;
  name: string;
  description: string;
  price: number;
}

export interface CreateReviewData {
  review_insert: Review_Key;
}

export interface CreateReviewVariables {
  productID: string;
  productSlug: string;
  productName: string;
  userID: string;
  userName: string;
  rating: number;
  content: string;
}

export interface DeleteProductData {
  product_delete?: Product_Key | null;
}

export interface DeleteProductVariables {
  id: UUIDString;
}

export interface DeleteReviewData {
  review_delete?: Review_Key | null;
}

export interface DeleteReviewVariables {
  id: UUIDString;
}

export interface GetProductReviewsData {
  reviews: ({
    id: UUIDString;
    productID: string;
    productSlug: string;
    productName: string;
    rating: number;
    content: string;
    contentEmbedding: {
    };
      createdAt: DateString;
      userID: string;
      userName: string;
  } & Review_Key)[];
}

export interface GetProductReviewsVariables {
  productId: string;
}

export interface Product_Key {
  id: UUIDString;
  __typename?: 'Product_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface SearchProductDescriptionUsingL2similarityData {
  products_descriptionEmbedding_similarity: ({
    productID: string;
    productSlug: string;
    productName: string;
  })[];
}

export interface SearchProductDescriptionUsingL2similarityVariables {
  query: string;
}

export interface SearchProductNameUsingL2similarityData {
  products_nameEmbedding_similarity: ({
    productID: string;
    productSlug: string;
    productName: string;
  })[];
}

export interface SearchProductNameUsingL2similarityVariables {
  query: string;
}

export interface SearchProductsData {
  products: ({
    id: UUIDString;
    productID: string;
    productSlug: string;
    productName: string;
    name: string;
    price: number;
    description: string;
    descriptionEmbedding: {
    };
  } & Product_Key)[];
}

export interface SearchProductsVariables {
  nameInput?: string | null;
}

export interface SearchReviewContentUsingL2similarityData {
  reviews_contentEmbedding_similarity: ({
    productID: string;
    productSlug: string;
    productName: string;
  })[];
}

export interface SearchReviewContentUsingL2similarityVariables {
  query: string;
}

export interface UpdateProductData {
  product_update?: Product_Key | null;
}

export interface UpdateProductVariables {
  id: UUIDString;
  name: string;
  description: string;
  price: number;
  productID: string;
  productSlug: string;
}

export interface UpdateReviewData {
  review_update?: Review_Key | null;
}

export interface UpdateReviewVariables {
  id: UUIDString;
  rating: number;
  content: string;
}



/* Allow users to create refs without passing in DataConnect */
export function createProductRef(vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
/* Allow users to pass in custom DataConnect instances */
export function createProductRef(dc: DataConnect, vars: CreateProductVariables): MutationRef<CreateProductData,CreateProductVariables>;

export function createProduct(vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;
export function createProduct(dc: DataConnect, vars: CreateProductVariables): MutationPromise<CreateProductData,CreateProductVariables>;


/* Allow users to create refs without passing in DataConnect */
export function updateProductRef(vars: UpdateProductVariables): MutationRef<UpdateProductData, UpdateProductVariables>;
/* Allow users to pass in custom DataConnect instances */
export function updateProductRef(dc: DataConnect, vars: UpdateProductVariables): MutationRef<UpdateProductData,UpdateProductVariables>;

export function updateProduct(vars: UpdateProductVariables): MutationPromise<UpdateProductData, UpdateProductVariables>;
export function updateProduct(dc: DataConnect, vars: UpdateProductVariables): MutationPromise<UpdateProductData,UpdateProductVariables>;


/* Allow users to create refs without passing in DataConnect */
export function deleteProductRef(vars: DeleteProductVariables): MutationRef<DeleteProductData, DeleteProductVariables>;
/* Allow users to pass in custom DataConnect instances */
export function deleteProductRef(dc: DataConnect, vars: DeleteProductVariables): MutationRef<DeleteProductData,DeleteProductVariables>;

export function deleteProduct(vars: DeleteProductVariables): MutationPromise<DeleteProductData, DeleteProductVariables>;
export function deleteProduct(dc: DataConnect, vars: DeleteProductVariables): MutationPromise<DeleteProductData,DeleteProductVariables>;


/* Allow users to create refs without passing in DataConnect */
export function createReviewRef(vars: CreateReviewVariables): MutationRef<CreateReviewData, CreateReviewVariables>;
/* Allow users to pass in custom DataConnect instances */
export function createReviewRef(dc: DataConnect, vars: CreateReviewVariables): MutationRef<CreateReviewData,CreateReviewVariables>;

export function createReview(vars: CreateReviewVariables): MutationPromise<CreateReviewData, CreateReviewVariables>;
export function createReview(dc: DataConnect, vars: CreateReviewVariables): MutationPromise<CreateReviewData,CreateReviewVariables>;


/* Allow users to create refs without passing in DataConnect */
export function updateReviewRef(vars: UpdateReviewVariables): MutationRef<UpdateReviewData, UpdateReviewVariables>;
/* Allow users to pass in custom DataConnect instances */
export function updateReviewRef(dc: DataConnect, vars: UpdateReviewVariables): MutationRef<UpdateReviewData,UpdateReviewVariables>;

export function updateReview(vars: UpdateReviewVariables): MutationPromise<UpdateReviewData, UpdateReviewVariables>;
export function updateReview(dc: DataConnect, vars: UpdateReviewVariables): MutationPromise<UpdateReviewData,UpdateReviewVariables>;


/* Allow users to create refs without passing in DataConnect */
export function deleteReviewRef(vars: DeleteReviewVariables): MutationRef<DeleteReviewData, DeleteReviewVariables>;
/* Allow users to pass in custom DataConnect instances */
export function deleteReviewRef(dc: DataConnect, vars: DeleteReviewVariables): MutationRef<DeleteReviewData,DeleteReviewVariables>;

export function deleteReview(vars: DeleteReviewVariables): MutationPromise<DeleteReviewData, DeleteReviewVariables>;
export function deleteReview(dc: DataConnect, vars: DeleteReviewVariables): MutationPromise<DeleteReviewData,DeleteReviewVariables>;


/* Allow users to create refs without passing in DataConnect */
export function searchProductsRef(vars?: SearchProductsVariables): QueryRef<SearchProductsData, SearchProductsVariables>;
/* Allow users to pass in custom DataConnect instances */
export function searchProductsRef(dc: DataConnect, vars?: SearchProductsVariables): QueryRef<SearchProductsData,SearchProductsVariables>;

export function searchProducts(vars?: SearchProductsVariables): QueryPromise<SearchProductsData, SearchProductsVariables>;
export function searchProducts(dc: DataConnect, vars?: SearchProductsVariables): QueryPromise<SearchProductsData,SearchProductsVariables>;


/* Allow users to create refs without passing in DataConnect */
export function getProductReviewsRef(vars: GetProductReviewsVariables): QueryRef<GetProductReviewsData, GetProductReviewsVariables>;
/* Allow users to pass in custom DataConnect instances */
export function getProductReviewsRef(dc: DataConnect, vars: GetProductReviewsVariables): QueryRef<GetProductReviewsData,GetProductReviewsVariables>;

export function getProductReviews(vars: GetProductReviewsVariables): QueryPromise<GetProductReviewsData, GetProductReviewsVariables>;
export function getProductReviews(dc: DataConnect, vars: GetProductReviewsVariables): QueryPromise<GetProductReviewsData,GetProductReviewsVariables>;


/* Allow users to create refs without passing in DataConnect */
export function searchProductDescriptionUsingL2similarityRef(vars: SearchProductDescriptionUsingL2similarityVariables): QueryRef<SearchProductDescriptionUsingL2similarityData, SearchProductDescriptionUsingL2similarityVariables>;
/* Allow users to pass in custom DataConnect instances */
export function searchProductDescriptionUsingL2similarityRef(dc: DataConnect, vars: SearchProductDescriptionUsingL2similarityVariables): QueryRef<SearchProductDescriptionUsingL2similarityData,SearchProductDescriptionUsingL2similarityVariables>;

export function searchProductDescriptionUsingL2similarity(vars: SearchProductDescriptionUsingL2similarityVariables): QueryPromise<SearchProductDescriptionUsingL2similarityData, SearchProductDescriptionUsingL2similarityVariables>;
export function searchProductDescriptionUsingL2similarity(dc: DataConnect, vars: SearchProductDescriptionUsingL2similarityVariables): QueryPromise<SearchProductDescriptionUsingL2similarityData,SearchProductDescriptionUsingL2similarityVariables>;


/* Allow users to create refs without passing in DataConnect */
export function searchProductNameUsingL2similarityRef(vars: SearchProductNameUsingL2similarityVariables): QueryRef<SearchProductNameUsingL2similarityData, SearchProductNameUsingL2similarityVariables>;
/* Allow users to pass in custom DataConnect instances */
export function searchProductNameUsingL2similarityRef(dc: DataConnect, vars: SearchProductNameUsingL2similarityVariables): QueryRef<SearchProductNameUsingL2similarityData,SearchProductNameUsingL2similarityVariables>;

export function searchProductNameUsingL2similarity(vars: SearchProductNameUsingL2similarityVariables): QueryPromise<SearchProductNameUsingL2similarityData, SearchProductNameUsingL2similarityVariables>;
export function searchProductNameUsingL2similarity(dc: DataConnect, vars: SearchProductNameUsingL2similarityVariables): QueryPromise<SearchProductNameUsingL2similarityData,SearchProductNameUsingL2similarityVariables>;


/* Allow users to create refs without passing in DataConnect */
export function searchReviewContentUsingL2similarityRef(vars: SearchReviewContentUsingL2similarityVariables): QueryRef<SearchReviewContentUsingL2similarityData, SearchReviewContentUsingL2similarityVariables>;
/* Allow users to pass in custom DataConnect instances */
export function searchReviewContentUsingL2similarityRef(dc: DataConnect, vars: SearchReviewContentUsingL2similarityVariables): QueryRef<SearchReviewContentUsingL2similarityData,SearchReviewContentUsingL2similarityVariables>;

export function searchReviewContentUsingL2similarity(vars: SearchReviewContentUsingL2similarityVariables): QueryPromise<SearchReviewContentUsingL2similarityData, SearchReviewContentUsingL2similarityVariables>;
export function searchReviewContentUsingL2similarity(dc: DataConnect, vars: SearchReviewContentUsingL2similarityVariables): QueryPromise<SearchReviewContentUsingL2similarityData,SearchReviewContentUsingL2similarityVariables>;


