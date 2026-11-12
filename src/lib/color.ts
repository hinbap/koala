function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Linear mix of two #rrggbb colours; f = 0 → a, f = 1 → b. */
export function mix(a: string, b: string, f: number): string {
  const x = toRgb(a), y = toRgb(b);
  return '#' + [0, 1, 2].map((i) => Math.round(x[i] + (y[i] - x[i]) * f).toString(16).padStart(2, '0')).join('');
}
