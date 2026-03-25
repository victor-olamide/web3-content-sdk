# web3-content-sdk

npm packages for building Web3 content monetization apps on the Stacks blockchain.

## Packages

| Package | Version | Description |
|---|---|---|
| [`@victor-olamide/stacks-sdk`](./packages/stacks-sdk) | 1.0.0 | Contract interactions — pay-per-view, token gating, subscriptions |
| [`@victor-olamide/content-utils`](./packages/content-utils) | 1.0.0 | Utilities — encryption, IPFS/Pinata upload, STX pricing, data export |
| [`@victor-olamide/content-cli`](./packages/cli) | 1.0.0 | CLI tool — deploy contracts, manage content, check access |

## Installation

```bash
npm install @victor-olamide/stacks-sdk
npm install @victor-olamide/content-utils
npm install -g @victor-olamide/content-cli
```

## Usage

### stacks-sdk

```ts
import { hasAccess, getContentInfo, getWalletBalance } from '@victor-olamide/stacks-sdk';

const config = { network: 'mainnet', contractAddress: 'SP...' };

// Check if user has purchased content
const access = await hasAccess(42, 'SP1...userAddress', config);

// Fetch on-chain content metadata
const info = await getContentInfo(42, config);

// Get wallet STX balance
const { balance, available } = await getWalletBalance('SP1...', 'mainnet');
```

### content-utils

```ts
import { uploadFileToIPFS, stxToUsd, purchasesToCsv } from '@victor-olamide/content-utils';

// Upload a file to IPFS via Pinata
const ipfsUrl = await uploadFileToIPFS(buffer, 'video.mp4', {
  apiKey: process.env.PINATA_API_KEY,
  secretApiKey: process.env.PINATA_SECRET_API_KEY,
});

// Convert STX to USD
const usdValue = await stxToUsd(100); // 100 STX → USD

// Export purchases as CSV string
const csv = purchasesToCsv(purchases);
```

### content-cli

```bash
# Deploy a Clarity contract
content-cli deploy pay-per-view ./contracts/pay-per-view.clar -k <privateKey> -n testnet

# Add content on-chain
content-cli content add 1 5.0 ipfs://QmXxx -a SP... -k <privateKey>

# Check if a user has access
content-cli content check-access 1 SP1...user -a SP...

# Check wallet balance
content-cli access balance SP1...address

# Check subscription status
content-cli access subscription SP1...user SP1...creator 1 -a SP...
```

## Development

```bash
npm install
npm run build
```

## License

MIT
