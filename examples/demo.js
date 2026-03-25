/**
 * web3-content-sdk — Node.js Demo
 * Demonstrates @victor-olamide/stacks-sdk and @victor-olamide/content-utils
 */

import * as stacksSdk from '@victor-olamide/stacks-sdk';
import * as contentUtils from '@victor-olamide/content-utils';

console.log('=== web3-content-sdk Demo ===\n');

// ── stacks-sdk ──────────────────────────────────────────────────────────────
console.log('📦 @victor-olamide/stacks-sdk');
console.log('   Exports:', Object.keys(stacksSdk).join(', '));

const config = {
  network: 'testnet',
  contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
};

console.log('\n   Network config:', config.network);
console.log('   Contract names:', Object.values(stacksSdk.CONTRACT_NAMES).join(', '));
console.log('   Stacks API (testnet):', stacksSdk.STACKS_API.testnet);

// ── content-utils: pricing ───────────────────────────────────────────────────
console.log('\n📦 @victor-olamide/content-utils');
console.log('   Exports:', Object.keys(contentUtils).join(', '));

console.log('\n   [pricing] microStxToStx(5000000):', contentUtils.microStxToStx(5_000_000), 'STX');
console.log('   [pricing] stxToMicroStx(2.5):', contentUtils.stxToMicroStx(2.5), 'micro-STX');
console.log('   [pricing] formatStx(7500000):', contentUtils.formatStx(7_500_000));

// ── content-utils: encryption helpers ────────────────────────────────────────
console.log('\n   [encryption] isValidHex("a1b2c3"):', contentUtils.isValidHex('a1b2c3'));
console.log('   [encryption] isValidHex("xyz"):', contentUtils.isValidHex('xyz'));
console.log('   [encryption] stringToHex("hello"):', contentUtils.stringToHex('hello'));
console.log('   [encryption] hexToString("68656c6c6f"):', contentUtils.hexToString('68656c6c6f'));

const mockContent = { encryptedData: 'aabbcc', iv: '112233', authTag: 'ffeedd' };
console.log('   [encryption] isValidEncryptedContent(mock):', contentUtils.isValidEncryptedContent(mockContent));

// ── content-utils: access status ─────────────────────────────────────────────
const future = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
const past   = new Date(Date.now() - 1 * 86400 * 1000).toISOString();
console.log('\n   [access] formatExpirationDate(+7 days):', contentUtils.formatExpirationDate(future));
console.log('   [access] formatExpirationDate(-1 day):', contentUtils.formatExpirationDate(past));
console.log('   [access] isContentAccessValid(future):', contentUtils.isContentAccessValid(future));
console.log('   [access] getAccessStatusText(true,false,false):', contentUtils.getAccessStatusText(true, false, false));

// ── content-utils: export ─────────────────────────────────────────────────────
const purchases = [
  {
    contentTitle: 'Web3 Tutorial',
    contentType: 'video',
    creatorAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    purchasePrice: 5,
    purchaseDate: new Date().toISOString(),
    transactionStatus: 'confirmed',
    engagement: { viewCount: 3, completionPercentage: 80 },
    isFavorite: true,
    refundInfo: { refunded: false },
  },
];

const csv = contentUtils.purchasesToCsv(purchases);
console.log('\n   [export] purchasesToCsv — first line:', csv.split('\n')[0]);

const archive = contentUtils.buildDataArchive(
  { displayName: 'Victor', address: 'ST1P...' },
  purchases,
  { totalPurchases: 1, totalSpent: 5 }
);
console.log('   [export] buildDataArchive — exportDate present:', !!archive.exportDate);
console.log('   [export] buildDataArchive — totalPurchases:', archive.metadata.totalPurchases);

console.log('\n✅ All demos completed successfully.');
