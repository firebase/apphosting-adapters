import { List } from 'immutable';

const CHANNEL_SIZE = 255;

// Predefined colors
const COLORS_ARRAY = [
  'rgb(255, 104, 107)', // Red
  'rgb(162, 215, 41)', // Green
  'rgb(60, 145, 230)', // Blue
  'rgb(255, 190, 11)', // Amber
  'rgb(125, 91, 166)', // Purple
];

/**
 * Returns an array with colors for all bars.
 * If the predefined array is overflowed, the rest
 * of the data item bars will use a generated color.
 */
export function generateColorsArray(data: List<string>): string[] {
  const colors = [...COLORS_ARRAY];
  for (let i = colors.length; i < data.size; i++) {
    const di = data.get(i)!;
    colors.push(colorGenerator(di, i));
  }
  return colors;
}

/**
 * Apply average (grey) to a color channel;
 */
function averageColorChannel(channel: number): number {
  return Math.round((channel + 128) / 2);
}

/**
 * Generates an RGB color by a provided value and index.
 *
 * @param dataLabel
 * @param dataIndex
 * @returns RGB color string
 */
export function colorGenerator(dataLabel: string, dataIndex: number): string {
  const asciiSum = dataLabel
    .split('')
    .map((ch) => ch.charCodeAt(0))
    .reduce((a, b) => a + b, 0);

  const r = averageColorChannel(asciiSum ** 5 % CHANNEL_SIZE);
  const g = averageColorChannel(dataIndex ** dataIndex % CHANNEL_SIZE);
  const b = averageColorChannel(asciiSum ** 6 % CHANNEL_SIZE);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Calculates and returns the nearest ceiled max of a given number.
 * I.e. 1220 => 1300
 *
 * Used for determining the upper boundary of a bar or line chart.
 *
 * @param max Max value in the data set.
 */
export function getNearestCeiledMax(max: number) {
  const digits = max.toString().length - 2;
  const precision = 10 ** digits;

  return Math.ceil(max / precision) * precision;
}
