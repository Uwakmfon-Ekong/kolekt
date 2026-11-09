const N = 21;

function inFinder(x: number, y: number): boolean {
  const box = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
  return box(0, 0) || box(N - 7, 0) || box(0, N - 7);
}

function finderOn(x: number, y: number): boolean {
  const [lx, ly] =
    x < 7 && y < 7 ? [x, y] : x >= N - 7 && y < 7 ? [x - (N - 7), y] : [x, y - (N - 7)];
  const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6;
  const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
  return ring || core;
}

/** Decorative placeholder. Kolekt generates the real code per collection. */
export default function QrMock() {
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const on = inFinder(x, y) ? finderOn(x, y) : (x * 7 + y * 13 + x * y * 3) % 5 < 2;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }
  }
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} role="img" aria-label="Sample QR code" className="qr">
      <rect x={-1} y={-1} width={N + 2} height={N + 2} fill="#fff" />
      <g fill="#1B1238">{cells}</g>
    </svg>
  );
}
