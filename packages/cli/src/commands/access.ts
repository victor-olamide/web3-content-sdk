import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  callReadOnlyFunction,
  cvToJSON,
  uintCV,
  standardPrincipalCV,
} from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

function getNetwork(network: string) {
  return network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
}

export function accessCommand(): Command {
  const cmd = new Command('access');
  cmd.description('Check on-chain access and subscription status');

  // access subscription
  cmd
    .command('subscription <userAddress> <creatorAddress> <tierId>')
    .description('Check if a user has an active subscription')
    .requiredOption('-a, --address <contractAddress>', 'Contract address')
    .option('-n, --network <network>', 'mainnet or testnet', 'testnet')
    .action(async (
      userAddress: string,
      creatorAddress: string,
      tierId: string,
      opts: { address: string; network: string }
    ) => {
      const spinner = ora('Checking subscription...').start();
      try {
        const network = getNetwork(opts.network);
        const result = await callReadOnlyFunction({
          contractAddress: opts.address,
          contractName: 'subscription',
          functionName: 'is-subscribed',
          functionArgs: [
            standardPrincipalCV(userAddress),
            standardPrincipalCV(creatorAddress),
            uintCV(Number(tierId)),
          ],
          network,
          senderAddress: userAddress,
        });

        const subscribed = cvToJSON(result).value as boolean;
        spinner.stop();
        console.log(
          subscribed
            ? chalk.green(`✓ ${userAddress} is subscribed to tier #${tierId} of ${creatorAddress}`)
            : chalk.yellow(`✗ ${userAddress} is NOT subscribed to tier #${tierId} of ${creatorAddress}`)
        );
      } catch (err) {
        spinner.fail(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
      }
    });

  // access gating-rule
  cmd
    .command('gating-rule <contentId>')
    .description('Fetch the token-gating rule for a content item')
    .requiredOption('-a, --address <contractAddress>', 'Contract address')
    .option('-n, --network <network>', 'mainnet or testnet', 'testnet')
    .action(async (contentId: string, opts: { address: string; network: string }) => {
      const spinner = ora('Fetching gating rule...').start();
      try {
        const network = getNetwork(opts.network);
        const result = await callReadOnlyFunction({
          contractAddress: opts.address,
          contractName: 'content-gate',
          functionName: 'get-gating-rule',
          functionArgs: [uintCV(Number(contentId))],
          network,
          senderAddress: opts.address,
        });

        const data = cvToJSON(result);
        spinner.stop();

        if (!data.value) {
          console.log(chalk.yellow('No gating rule found for this content.'));
          return;
        }

        const v = data.value as Record<string, { value: unknown }>;
        console.log(chalk.bold('\nGating Rule'));
        console.log(`  Type:             ${v['gating-type']?.value ?? 'N/A'}`);
        console.log(`  Token Contract:   ${v['token-contract']?.value ?? 'N/A'}`);
        console.log(`  Minimum Amount:   ${Number(v['min-amount']?.value ?? 0) / 1_000_000}`);
      } catch (err) {
        spinner.fail(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
      }
    });

  // access balance
  cmd
    .command('balance <stxAddress>')
    .description('Fetch the STX balance of a wallet address')
    .option('-n, --network <network>', 'mainnet or testnet', 'testnet')
    .action(async (stxAddress: string, opts: { network: string }) => {
      const spinner = ora('Fetching balance...').start();
      try {
        const base =
          opts.network === 'mainnet'
            ? 'https://stacks-node-api.mainnet.stacks.co'
            : 'https://stacks-node-api.testnet.stacks.co';

        const res = await fetch(`${base}/v2/accounts/${stxAddress}?proof=0`);
        if (!res.ok) throw new Error(`API error: ${res.statusText}`);
        const data = await res.json() as { balance: string; locked: string };

        const balance = parseInt(data.balance, 16) / 1_000_000;
        const locked = parseInt(data.locked, 16) / 1_000_000;

        spinner.stop();
        console.log(chalk.bold(`\nWallet: ${stxAddress}`));
        console.log(`  Balance:   ${balance.toFixed(6)} STX`);
        console.log(`  Locked:    ${locked.toFixed(6)} STX`);
        console.log(`  Available: ${(balance - locked).toFixed(6)} STX`);
      } catch (err) {
        spinner.fail(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
      }
    });

  return cmd;
}
