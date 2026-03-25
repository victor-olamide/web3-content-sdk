/**
 * STX price utilities — fetch live prices and convert between STX and USD.
 */

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd&include_24hr_change=true';

let _cachedPrice: number | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Fetch the current STX/USD price from CoinGecko.
 * Results are cached for 60 seconds.
 */
export async function getSTXPrice(): Promise<number> {
  if (_cachedPrice !== null && Date.now() - _cacheTime < CACHE_TTL_MS) {
    return _cachedPrice;
  }

  const res = await fetch(COINGECKO_URL);
  if (!res.ok) throw new Error(`Failed to fetch STX price: ${res.statusText}`);

  const data = await res.json() as { blockstack?: { usd?: number } };
  const price = data.blockstack?.usd;
  if (typeof price !== 'number') throw new Error('Unexpected CoinGecko response shape');

  _cachedPrice = price;
  _cacheTime = Date.now();
  return price;
}

/**
 * Convert an STX amount to USD.
 */
export async function stxToUsd(amountStx: number): Promise<number> {
  const price = await getSTXPrice();
  return amountStx * price;
}

/**
 * Convert a USD amount to STX.
 */
export async function usdToStx(amountUsd: number): Promise<number> {
  const price = await getSTXPrice();
  if (price === 0) throw new Error('STX price is zero');
  return amountUsd / price;
}

/**
 * Batch-convert multiple STX amounts to USD.
 */
export async function batchStxToUsd(amounts: number[]): Promise<number[]> {
  const price = await getSTXPrice();
  return amounts.map((a) => a * price);
}

/**
 * Format an STX amount as a human-readable string, e.g. "12.50 STX".
 */
export function formatStx(microStx: number, decimals = 2): string {
  return `${(microStx / 1_000_000).toFixed(decimals)} STX`;
}

/**
 * Convert micro-STX (on-chain unit) to STX.
 */
export function microStxToStx(microStx: number): number {
  return microStx / 1_000_000;
}

/**
 * Convert STX to micro-STX (on-chain unit).
 */
export function stxToMicroStx(stx: number): number {
  return Math.round(stx * 1_000_000);
}

/** Clear the in-memory price cache. */
export function clearPriceCache(): void {
  _cachedPrice = null;
  _cacheTime = 0;
}
