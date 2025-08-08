export function generatePoints(
  count: number,
  startPrice: number,
  volatility: number
): [number, number][] {
  const points: [number, number][] = [];
  let price = startPrice;

  for (let i = 0; i < count; i++) {
    // Random % change between -volatility and +volatility
    const changePercent = (Math.random() * 2 - 1) * volatility;
    price += price * changePercent;

    // Keep at least two decimal places
    price = Math.round(price * 100) / 100;

    points.push([i, price]);
  }

  return points;
}
