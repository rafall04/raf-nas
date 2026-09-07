/** Placeholder QR deterministik (bukan QR asli) — diganti generator QR nyata di produksi. */
export function QRPlaceholder({ seed = 'rafnas', size = 128 }: { seed?: string; size?: number }): JSX.Element {
  const n = 21;
  const cell = size / n;
  const rects: JSX.Element[] = [];

  const on = (r: number, c: number): boolean => {
    // finder patterns di 3 pojok
    const finder = (br: number, bc: number): boolean =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7 &&
      (r === br || r === br + 6 || c === bc || c === bc + 6 || (r >= br + 2 && r <= br + 4 && c >= bc + 2 && c <= bc + 4));
    if (finder(0, 0) || finder(0, n - 7) || finder(n - 7, 0)) return true;
    if (r < 8 && c < 8) return false;
    if (r < 8 && c > n - 9) return false;
    if (r > n - 9 && c < 8) return false;
    const h = (r * 31 + c * 17 + seed.charCodeAt((r + c) % seed.length)) % 7;
    return h < 3;
  };

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (on(r, c)) {
        rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} />);
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Kode QR link">
      <rect x={0} y={0} width={size} height={size} fill="#fff" />
      <g fill="#131820">{rects}</g>
    </svg>
  );
}
