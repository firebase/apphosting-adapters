// Common environment variables
export interface CommonEnv {
  listNameMaxLength: number;
  cardTitleMaxLength: number;
  cardDescriptionMaxLength: number;
  labelNameMaxLength: number;
}

// Configuration-specific environment variables
export interface Environment extends CommonEnv {
  apiUrl: string;
}
