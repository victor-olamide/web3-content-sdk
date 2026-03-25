import {
  callReadOnlyFunction,
  cvToJSON,
  uintCV,
} from '@stacks/transactions';
import { getNetwork, getContractAddress, CONTRACT_NAMES } from '../network.js';
import type { StacksNetworkConfig, GatingRule } from '../types.js';

/**
 * Fetch the gating rule for a content item from the content-gate contract.
 */
export async function getGatingRule(
  contentId: number,
  config: StacksNetworkConfig
): Promise<GatingRule | null> {
  const network = getNetwork(config);
  const contractAddress = getContractAddress(config);

  const result = await callReadOnlyFunction({
    contractAddress,
    contractName: CONTRACT_NAMES.CONTENT_GATE,
    functionName: 'get-gating-rule',
    functionArgs: [uintCV(contentId)],
    network,
    senderAddress: contractAddress,
  });

  const data = cvToJSON(result);
  if (!data.value) return null;

  const val = data.value;
  return {
    type: val['gating-type']?.value ?? 'stx',
    contractAddress: val['token-contract']?.value,
    minAmount: val['min-amount']?.value ? Number(val['min-amount'].value) / 1_000_000 : undefined,
  };
}

/**
 * Check if a user meets the gating requirements for content (v2 contract).
 */
export async function checkGatingAccess(
  contentId: number,
  userAddress: string,
  config: StacksNetworkConfig
): Promise<boolean> {
  const network = getNetwork(config);
  const contractAddress = getContractAddress(config);

  try {
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName: 'content-gate-v2',
      functionName: 'check-access',
      functionArgs: [uintCV(contentId), { type: 5, address: userAddress } as any],
      network,
      senderAddress: userAddress,
    });

    return cvToJSON(result).value as boolean;
  } catch {
    return false;
  }
}
