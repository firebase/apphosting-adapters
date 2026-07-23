import { OrderedMap } from 'immutable';

export const LABEL_COLORS = OrderedMap<string, { hex: string; light: boolean }>(
  [
    ['red', { hex: '#da3232', light: false }],
    ['orange', { hex: '#de7222', light: false }],
    ['yellow', { hex: '#ffae00', light: true }],
    ['green', { hex: '#4aac35', light: false }],
    ['blue', { hex: '#0771e7', light: false }],
    ['purple', { hex: '#a04ad7', light: false }],
    ['army_green', { hex: '#5d6532', light: false }],
    ['navy', { hex: '#0034ab', light: false }],
    ['pink', { hex: '#e095e7', light: true }],
    ['grey', { hex: '#737373', light: false }],
  ],
);

export const COLOR_NAMES_MAP: { [key: string]: string } = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  army_green: 'Army Green',
  navy: 'Navy',
  pink: 'Pink',
  grey: 'Grey',
};
