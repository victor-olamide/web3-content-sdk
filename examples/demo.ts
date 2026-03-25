/**
 * web3-content-sdk — TypeScript Demo
 * Demonstrates full type safety across all three packages
 */

import {
  getNetwork,
  getContractAddress,
  CONTRACT_NAMES,
  STACKS_API,
  type StacksNetworkConfig,
  type ContentInfo,
  type GatingRule,
} from '@victor-olamide/stacks-sdk';

import {
  isValidHex,
  stringToHex,
  hexToString,
  isValidEncryptedContent,
  formatExpirationDate,
  isContentAccessValid,
  getAccessStatusText,
  microStxToStx,
  stxToMicroStx,
  formatStx,
  purchasesToCsv,
  buildDataArchive,
  type Purchase,
  type ProfileData,
  type PurchaseStats,
} from '@victor-olamide/content-utils';

console.log('=== web3-content-sdk TypeScript Demo ===\n');

// ── stacks-sdk: typed config ──────────────────────────────────────────────────
const config: StacksNetworkConfig = {
  network: 'testnet',
  contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
};

console.log('📦 stacks-sdk');
console.log('   Network:', config.network);
console.log('   Contract address:', getContractAddress(config));
console.log('   Contract names:', Object.values(CONTRACT_NAMES).join(', '));
console.log('   API base (mainnet):', STACKS_API.mainnet);

const mockContent: ContentInfo = {
  creator: 'ST1P...',
  price: 5.0,
  uri: 'ipfs://QmXxx',
  active: true,
};
console.log('   ContentInfo type check — price:', mockContent.price, 'STX');

const mockRule: GatingRule = {
  type: 'nft',
  contractAddress: 'ST1P...',
  minAmount: 1,
};
console.log('   GatingRule type check — type:', mockRule.type);

// ── content-utils: encryption ─────────────────────────────────────────────────
console.log('\n📦 content-utils');
const hex: string = stringToHex('stacks');
console.log('   stringToHex("stacks"):', hex);
console.log('   hexToString(result):', hexToString(hex));
console.log('   isValidHex("ff00aa"):', isValidHex('ff00aa'));

const valid = isValidEncryptedContent({ encryptedData: 'aabb', iv: 'ccdd', authTag: 'eeff' });
console.log('   isValidEncryptedContent(valid obj):', valid);

// ── content-utils: pricing ─────────────────────────────────────────────────────
const stx: number = microStxToStx(10_000_000);
const micro: number = stxToMicroStx(10);
console.log('\n   microStxToStx(10_000_000):', stx);
console.log('   stxToMicroStx(10):', micro);
console.log('   formatStx(3_500_000):', formatStx(3_500_000));

// ── content-utils: access ──────────────────────────────────────────────────────
const expiry: string = new Date(Date.now() + 3 * 86400 * 1000).toISOString();
console.log('\n   formatExpirationDate(+3d):', formatExpirationDate(expiry));
console.log('   isContentAccessValid(+3d):', isContentAccessValid(expiry));
console.log('   getAccessStatusText(active):', getAccessStatusText(true, false, false));
console.log('   getAccessStatusText(revoked):', getAccessStatusText(false, false, true));

// ── content-utils: typed export ────────────────────────────────────────────────
const purchases: Purchase[] = [
  {
    contentTitle: 'Stacks DeFi Course',
    contentType: 'video',
    creatorAddress: 'ST1P...',
    purchasePrice: 10,
    purchaseDate: new Date().toISOString(),
    transactionStatus: 'confirmed',
    engagement: { viewCount: 5, completionPercentage: 100 },
    isFavorite: false,
    refundInfo: { refunded: false },
  },
];

const profile: ProfileData = {
  displayName: 'Victor Olamide',
  username: 'viktorzy',
  address: 'ST1P...',
  profileCompleteness: 90,
};

const stats: PurchaseStats = {
  totalPurchases: 1,
  totalSpent: 10,
  favoriteCount: 0,
};

const csv: string = purchasesToCsv(purchases);
console.log('\n   purchasesToCsv headers:', csv.split('\n')[0]);

const archive = buildDataArchive(profile, purchases, stats);
console.log('   buildDataArchive — profile.displayName:', archive.profile.displayName);
console.log('   buildDataArchive — metadata.totalSpent:', archive.metadata.totalSpent);

console.log('\n✅ TypeScript demo completed — all types resolved correctly.');
