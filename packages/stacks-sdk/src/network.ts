import { StacksMainnet, StacksTestnet } from '@stacks/network';
import type { StacksNetworkConfig } from './types.js';

export const DEFAULT_CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

export const CONTRACT_NAMES = {
  PAY_PER_VIEW: 'pay-per-view',
  CONTENT_GATE: 'content-gate',
  SUBSCRIPTION: 'subscription',
} as const;

export function getNetwork(config: StacksNetworkConfig) {
  return config.network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
}

export function getContractAddress(config: StacksNetworkConfig): string {
  return config.contractAddress ?? DEFAULT_CONTRACT_ADDRESS;
}

export const STACKS_API = {
  mainnet: 'https://stacks-node-api.mainnet.stacks.co',
  testnet: 'https://stacks-node-api.testnet.stacks.co',
} as const;

export async function getWalletBalance(
  stxAddress: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<{ balance: number; locked: number; available: number }> {
  const base = STACKS_API[network];
  const res = await fetch(`${base}/v2/accounts/${stxAddress}?proof=0`);
  if (!res.ok) throw new Error(`Failed to fetch balance: ${res.statusText}`);
  const data = await res.json() as { balance: string; locked: string };
  const balance = parseInt(data.balance, 16) / 1_000_000;
  const locked = parseInt(data.locked, 16) / 1_000_000;
  return { balance, locked, available: balance - locked };
}
