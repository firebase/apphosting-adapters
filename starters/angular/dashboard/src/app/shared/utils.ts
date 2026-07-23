/**
 * Rounds a number by a provided precision
 */
export function precisionRound(value: number, precision: number): number {
  const p = 10 ** precision;
  return Math.round(value * p) / p;
}
