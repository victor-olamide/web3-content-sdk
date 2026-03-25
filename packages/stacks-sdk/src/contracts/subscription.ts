import {
  callReadOnlyFunction,
  cvToJSON,
  standardPrincipalCV,
  uintCV,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
} from '@stacks/transactions';
import { getNetwork, getContractAddress, CONTRACT_NAMES } from '../network.js';
import type { StacksNetworkConfig, SubscriptionStatus } from '../types.js';

/**
 * Check if a user has an active subscription to a creator on-chain.
 */
export async function isSubscribed(
  userAddress: string,
  creatorAddress: string,
  tierId: number,
  config: StacksNetworkConfig
): Promise<boolean> {
  const network = getNetwork(config);
  const contractAddress = getContractAddress(config);

  const result = await callReadOnlyFunction({
    contractAddress,
    contractName: CONTRACT_NAMES.SUBSCRIPTION,
    functionName: 'is-subscribed',
    functionArgs: [
      standardPrincipalCV(userAddress),
      standardPrincipalCV(creatorAddress),
      uintCV(tierId),
    ],
    network,
    senderAddress: userAddress,
  });

  return cvToJSON(result).value as boolean;
}

/**
 * Fetch subscription status details for a user/creator/tier combination.
 */
export async function getSubscriptionStatus(
  userAddress: string,
  creatorAddress: string,
  tierId: number,
  config: StacksNetworkConfig
): Promise<SubscriptionStatus> {
  const active = await isSubscribed(userAddress, creatorAddress, tierId, config);
  return { active, tierId };
}

/**
 * Subscribe a user to a creator tier. Builds, signs, and broadcasts the tx.
 * Returns the transaction ID.
 */
export async function subscribe(
  creatorAddress: string,
  tierId: number,
  priceStx: number,
  senderAddress: string,
  senderKey: string,
  config: StacksNetworkConfig
): Promise<string> {
  const network = getNetwork(config);
  const contractAddress = getContractAddress(config);
  const priceMicroStx = Math.round(priceStx * 1_000_000);

  const postCondition = makeStandardSTXPostCondition(
    senderAddress,
    FungibleConditionCode.Equal,
    BigInt(priceMicroStx)
  );

  const tx = await makeContractCall({
    contractAddress,
    contractName: CONTRACT_NAMES.SUBSCRIPTION,
    functionName: 'subscribe',
    functionArgs: [standardPrincipalCV(creatorAddress), uintCV(tierId)],
    postConditions: [postCondition],
    postConditionMode: PostConditionMode.Deny,
    anchorMode: AnchorMode.Any,
    network,
    senderKey,
  });

  const result = await broadcastTransaction(tx, network);
  if ('error' in result) throw new Error(`Broadcast failed: ${result.error}`);
  return result.txid;
}
