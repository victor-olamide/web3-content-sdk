import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  callReadOnlyFunction,
  cvToJSON,
  uintCV,
  standardPrincipalCV,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

function getNetwork(network: string) {
  return network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
}

export function contentCommand(): Command {
  const cmd = new Command('content');
  cmd.description('Manage on-chain content (pay-per-view contract)');

  // content info
  cmd
    .command('info <contentId>')
    .description('Fetch on-chain metadata for a content item')
    .requiredOption('-a, --address <contractAddress>', 'Contract address')
    .option('-n, --network <network>', 'mainnet or testnet', 'testnet')
    .action(async (contentId: string, opts: { address: string; network: string }) => {
      const spinner = ora('Fetching content info...').start();
      try {
        const network = getNetwork(opts.network);
        const result = await callReadOnlyFunction({
          contractAddress: opts.address,
          contractName: 'pay-per-view',
          functionName: 'get-content-info',
          functionArgs: [uintCV(Number(contentId))],
          network,
          senderAddress: opts.address,
        });

        const data = cvToJSON(result);
        spinner.stop();

        if (!data.value) {
          console.log(chalk.yellow('Content not found.'));
          return;
        }

        const v = data.value as Record<string, { value: unknown }>;
        console.log(chalk.bold('\nContent Info'));
        console.log(`  ID:      ${contentId}`);
        console.log(`  Creator: ${v['creator']?.value ?? 'N/A'}`);
        console.log(`  Price:   ${Number(v['price']?.value ?? 0) / 1_000_000} STX`);
        console.log(`  URI:     ${v['uri']?.value ?? 'N/A'}`);
        console.log(`  Active:  ${v['active']?.value ?? false}`);
      } catch (err) {
        spinner.fail(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
      }
    });

  // content check-access
  cmd
    .command('check-access <contentId> <userAddress>')
    .description('Check if a user has purchased access to content')
    .requiredOption('-a, --address <contractAddress>', 'Contract address')
    .option('-n, --network <network>', 'mainnet or testnet', 'testnet')
    .action(async (contentId: string, userAddress: string, opts: { address: string; network: string }) => {
      const spinner = ora('Checking access...').start();
      try {
        const network = getNetwork(opts.network);
        const result = await callReadOnlyFunction({
          contractAddress: opts.address,
          contractName: 'pay-per-view',
          functionName: 'has-access',
          functionArgs: [uintCV(Number(contentId)), standardPrincipalCV(userAddress)],
          network,
          senderAddress: userAddress,
        });

        const hasAccess = cvToJSON(result).value as boolean;
        spinner.stop();
        console.log(
          hasAccess
            ? chalk.green(`✓ ${userAddress} has access to content #${contentId}`)
            : chalk.red(`✗ ${userAddress} does NOT have access to content #${contentId}`)
        );
      } catch (err) {
        spinner.fail(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
      }
    });

  // content add
  cmd
    .command('add <contentId> <priceStx> <uri>')
    .description('Register new content on-chain (creator operation)')
    .requiredOption('-a, --address <contractAddress>', 'Contract address')
    .requiredOption('-k, --key <privateKey>', 'Creator private key (hex)')
    .option('-n, --network <network>', 'mainnet or testnet', 'testnet')
    .action(async (
      contentId: string,
      priceStx: string,
      uri: string,
      opts: { address: string; key: string; network: string }
    ) => {
      const spinner = ora(`Adding content #${contentId}...`).start();
      try {
        const network = getNetwork(opts.network);
        const priceMicroStx = Math.round(Number(priceStx) * 1_000_000);

        const tx = await makeContractCall({
          contractAddress: opts.address,
          contractName: 'pay-per-view',
          functionName: 'add-content',
          functionArgs: [
            uintCV(Number(contentId)),
            uintCV(priceMicroStx),
            { type: 13, data: uri } as any,
          ],
          postConditionMode: PostConditionMode.Deny,
          anchorMode: AnchorMode.Any,
          network,
          senderKey: opts.key,
        });

        const result = await broadcastTransaction(tx, network);
        if ('error' in result) {
          spinner.fail(chalk.red(`Failed: ${result.error}`));
          process.exit(1);
        }

        spinner.succeed(chalk.green(`Content added! tx ID: ${result.txid}`));
      } catch (err) {
        spinner.fail(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
      }
    });

  return cmd;
}
