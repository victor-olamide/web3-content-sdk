// Network & config
export { getNetwork, getContractAddress, getWalletBalance, CONTRACT_NAMES, DEFAULT_CONTRACT_ADDRESS, STACKS_API } from './network.js';

// Types
export type {
  StacksNetworkConfig,
  ContentInfo,
  GatingRule,
  SubscriptionStatus,
  PurchaseResult,
  WalletBalance,
} from './types.js';

// Pay-per-view contract
export {
  hasAccess,
  getContentInfo,
  buildPurchaseContentTx,
  purchaseContent,
  addContent,
} from './contracts/payPerView.js';

// Content gate contract
export {
  getGatingRule,
  checkGatingAccess,
} from './contracts/contentGate.js';

// Subscription contract
export {
  isSubscribed,
  getSubscriptionStatus,
  subscribe,
} from './contracts/subscription.js';
