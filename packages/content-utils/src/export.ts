/**
 * Data export utilities — generate CSV and JSON representations of purchases and profiles.
 * Works in both Node.js and browser environments (browser features gated behind checks).
 */

export interface Purchase {
  contentTitle?: string;
  contentType?: string;
  creatorAddress?: string;
  purchasePrice?: number;
  purchaseDate?: string | Date;
  transactionStatus?: string;
  engagement?: { viewCount?: number; completionPercentage?: number };
  rating?: { score?: number; review?: string };
  isFavorite?: boolean;
  refundInfo?: { refunded?: boolean };
}

export interface ProfileData {
  displayName?: string;
  username?: string;
  address?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    discord?: string;
    website?: string;
  };
  settings?: {
    language?: string;
    theme?: string;
    currency?: string;
    timezone?: string;
  };
  profileCompleteness?: number;
}

export interface PurchaseStats {
  totalPurchases?: number;
  totalSpent?: number;
  favoriteCount?: number;
}

/**
 * Serialize an array of purchases to a CSV string.
 */
export function purchasesToCsv(purchases: Purchase[]): string {
  if (purchases.length === 0) throw new Error('No purchases to export');

  const headers = [
    'Content Title',
    'Content Type',
    'Creator Address',
    'Purchase Price',
    'Purchase Date',
    'Transaction Status',
    'Views',
    'Completion %',
    'Rating',
    'Review',
    'Is Favorite',
    'Refunded',
  ];

  const rows = purchases.map((p) => [
    p.contentTitle ?? '',
    p.contentType ?? '',
    p.creatorAddress ?? '',
    p.purchasePrice ?? '',
    p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : '',
    p.transactionStatus ?? '',
    p.engagement?.viewCount ?? 0,
    p.engagement?.completionPercentage ?? 0,
    p.rating?.score ?? 'N/A',
    (p.rating?.review ?? '').replace(/"/g, '""'),
    p.isFavorite ? 'Yes' : 'No',
    p.refundInfo?.refunded ? 'Yes' : 'No',
  ]);

  return [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        )
        .join(',')
    ),
  ].join('\n');
}

/**
 * Build a complete data archive object (JSON-serializable).
 */
export function buildDataArchive(
  profile: ProfileData,
  purchases: Purchase[],
  stats: PurchaseStats
) {
  return {
    exportDate: new Date().toISOString(),
    profile,
    purchases,
    stats,
    metadata: {
      totalPurchases: purchases.length,
      totalSpent: stats.totalSpent,
      profileCompleteness: profile.profileCompleteness,
    },
  };
}

/**
 * Write a file to disk (Node.js only).
 */
export async function writeToDisk(content: string, filePath: string): Promise<void> {
  const { writeFile } = await import('fs/promises');
  await writeFile(filePath, content, 'utf-8');
}

/**
 * Trigger a browser file download.
 * Only works in browser environments — throws in Node.js.
 */
export function downloadInBrowser(content: string, fileName: string, mimeType: string): void {
  if (typeof window === 'undefined') {
    throw new Error('downloadInBrowser() can only be called in a browser environment');
  }
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download purchases as a CSV file in the browser.
 */
export function downloadPurchasesCsv(purchases: Purchase[]): void {
  const csv = purchasesToCsv(purchases);
  downloadInBrowser(csv, `purchases_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Download a JSON object as a file in the browser.
 */
export function downloadJson(data: unknown, fileName?: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadInBrowser(json, fileName ?? `export_${Date.now()}.json`, 'application/json');
}
