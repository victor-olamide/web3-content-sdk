import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
} from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export function deployCommand(): Command {
  const cmd = new Command('deploy');
  cmd
    .description('Deploy a Clarity smart contract to the Stacks blockchain')
    .argument('<contract-name>', 'Name for the deployed contract (e.g. pay-per-view)')
    .argument('<contract-path>', 'Path to the .clar file')
    .requiredOption('-k, --key <privateKey>', 'Deployer private key (hex)')
    .option('-n, --network <network>', 'mainnet or testnet', 'testnet')
    .action(async (contractName: string, contractPath: string, opts: { key: string; network: string }) => {
      const spinner = ora(`Deploying ${chalk.cyan(contractName)}...`).start();

      try {
        const network = opts.network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
        const codeBody = readFileSync(resolve(contractPath), 'utf-8');

        const tx = await makeContractDeploy({
          contractName,
          codeBody,
          senderKey: opts.key,
          network,
          anchorMode: AnchorMode.Any,
        });

        const result = await broadcastTransaction(tx, network);

        if ('error' in result) {
          spinner.fail(chalk.red(`Deployment failed: ${result.error}`));
          process.exit(1);
        }

        spinner.succeed(
          chalk.green(`Contract deployed successfully!\n`) +
            `  ${chalk.bold('tx ID:')} ${result.txid}\n` +
            `  ${chalk.bold('Network:')} ${opts.network}`
        );
      } catch (err) {
        spinner.fail(chalk.red(`Deployment error: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
      }
    });

  return cmd;
}
