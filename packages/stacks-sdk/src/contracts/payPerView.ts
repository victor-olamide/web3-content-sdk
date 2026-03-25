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
  type StacksTransaction,
} from '@stacks/transactions';
import { getNetwork, getContractAddress, CONTRACT_NAMES } from '../network.js';
import type { StacksNetworkConfig, ContentInfo } from '../types.js';

/**
 * Check if a user has purchased access to a content item on-chain.
 */
export async function hasAccess(
  contentId: number,
  userAddress: string,
  config: StacksNetworkConfig
): Promise<boolean> {
  const network = getNetwork(config);
  const contractAddress = getContractAddress(config);

  const result = await callReadOnlyFunction({
    contractAddress,
    contractName: CONTRACT_NAMES.PAY_PER_VIEW,
    functionName: 'has-access',
    functionArgs: [uintCV(contentId), standardPrincipalCV(userAddress)],
    network,
    senderAddress: userAddress,
  });

  return cvToJSON(result).value as boolean;
}

/**
 * Fetch on-chain metadata for a content item.
 */
export async function getContentInfo(
  contentId: number,
  config: StacksNetworkConfig
): Promise<ContentInfo | null> {
  const network = getNetwork(config);
  const contractAddress = getContractAddress(config);

  const result = await callReadOnlyFunction({
    contractAddress,
    contractName: CONTRACT_NAMES.PAY_PER_VIEW,
    functionName: 'get-content-info',
    functionArgs: [uintCV(contentId)],
    network,
    senderAddress: contractAddress,
  });

  const data = cvToJSON(result);
  if (!data.value) return null;

  const val = data.value;
  return {
    creator: val.creator?.value ?? '',
    price: Number(val.price?.value ?? 0) / 1_000_000,
    uri: val.uri?.value ?? '',
    active: val.active?.value ?? false,
  };
}

/**
 * Build an unsigned `purchase-content` transaction.
 * Pass the result to a Stacks wallet (e.g. @stacks/connect) or broadcast directly.
 */
export async function buildPurchaseContentTx(
  contentId: number,
  priceStx: number,
  senderAddress: string,
  senderKey: string,
  config: StacksNetworkConfig
): Promise<StacksTransaction> {
  const network = getNetwork(config);
  const contractAddress = getContractAddress(config);
  const priceMicroStx = Math.round(priceStx * 1_000_000);

  const postCondition = makeStandardSTXPostCondition(
    senderAddress,
    FungibleConditionCode.Equal,
    BigInt(priceMicroStx)
  );

  return makeContractCall({
    contractAddress,
    contractName: CONTRACT_NAMES.PAY_PER_VIEW,
    functionName: 'purchase-content',
    functionArgs: [uintCV(contentId)],
    postConditions: [postCondition],
    postConditionMode: PostConditionMode.Deny,
    anchorMode: AnchorMode.Any,
    network,
    senderKey,
  });
}

/**
 * Build and broadcast a `purchase-content` transaction.
 * Returns the transaction ID.
 */
export async function purchaseContent(
  contentId: number,
  priceStx: number,
  senderAddress: string,
  senderKey: string,
  config: StacksNetworkConfig
): Promise<string> {
  const network = getNetwork(config);
  const tx = await buildPurchaseContentTx(contentId, priceStx, senderAddress, senderKey, config);
  const result = await broadcastTransaction(tx, network);
  if ('error' in result) throw new Error(`Broadcast failed: ${result.error}`);
  return result.txid;
}

/**
 * Build and broadcast an `add-content` transaction (creator only).
 * Returns the transaction ID.
 */
export async function addContent(
  contentId: number,
  priceStx: number,
  uri: string,
  senderKey: string,
  config: StacksNetworkConfig
): Promise<string> {
  const network = getNetwork(config);
  const contractAddress = getContractAddress(config);
  const priceMicroStx = Math.round(priceStx * 1_000_000);

  const tx = await makeContractCall({
    contractAddress,
    contractName: CONTRACT_NAMES.PAY_PER_VIEW,
    functionName: 'add-content',
    functionArgs: [uintCV(contentId), uintCV(priceMicroStx), { type: 13, data: uri } as any],
    postConditionMode: PostConditionMode.Deny,
    anchorMode: AnchorMode.Any,
    network,
    senderKey,
  });

  const result = await broadcastTransaction(tx, network);
  if ('error' in result) throw new Error(`Broadcast failed: ${result.error}`);
  return result.txid;
}
