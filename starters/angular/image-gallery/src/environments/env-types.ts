// Common environment variables
export interface CommonEnv {
  imagesListPageSize: number;
}

// Configuration-specific environment variables
export interface Environment extends CommonEnv {
  apiUrl: string;
  imageCdnUrl: string;
}
