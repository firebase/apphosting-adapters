// The breakpoints should kept in sync with `_screen-breakpoints.scss`.

export type ScreenBreakpoint = '400w' | '600w' | '800w' | '1000w' | '1100w';

export const BREAKPOINT_SIZE: { [key in ScreenBreakpoint]: number } = {
  '1100w': 1080,
  '1000w': 979,
  '800w': 828,
  '600w': 640,
  '400w': 384,
};
