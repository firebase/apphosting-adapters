// API image model
export type ApiImage = {
  src: string;
  width: number;
  height: number;
  metadata?: { [key: string]: string | number };
};
