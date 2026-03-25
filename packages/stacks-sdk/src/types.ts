export interface StacksNetworkConfig {
  network: 'mainnet' | 'testnet';
  contractAddress?: string;
}

export interface ContentInfo {
  creator: string;
  price: number;
  uri: string;
  active: boolean;
}

export interface GatingRule {
  type: 'ft' | 'nft' | 'stx';
  contractAddress?: string;
  contractName?: string;
  minAmount?: number;
}

export interface SubscriptionStatus {
  active: boolean;
  tierId: number;
  expiresAt?: number;
}

export interface PurchaseResult {
  txId: string;
}

export interface WalletBalance {
  balance: number;
  locked: number;
  available: number;
}
