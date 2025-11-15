# Auto-Redeem Rescue Script

A rescue script that continuously attempts to withdraw funds from a vault with limited liquidity.

**Works with any ERC-4626 compliant vault** - simply update the vault address and network configuration.

## ⚠️ Security Warning

**Always create a fresh, one-time wallet to run this bot. Never use your main wallet's private key.**

**How to do this safely:**
1. Generate a new wallet at [vanity-eth.tk](https://vanity-eth.tk/) or using any wallet generator
2. Use this new wallet's private key in your `.env` file
3. Only send to this bot wallet:
   - The vault share tokens you want to redeem
   - A small amount of native token (ETH/AVAX) for gas fees
4. Set your main wallet as the `OWNER` - this is where redeemed assets will be sent

This way, even if something goes wrong, only the bot wallet is at risk, not your main funds.

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure `.env` file

Create a `.env` file in the project root with the following variables:

```env
PRIVATE_KEY=one_time_wallet_private_key

RPC_URL=https://avax-mainnet.g.alchemy.com/v2/your_api_key

OWNER=your_main_wallet_address
```

**What each variable means:**

- `PRIVATE_KEY`: The private key of your one-time bot wallet (without the `0x` prefix)
- `RPC_URL`: The RPC endpoint URL for the blockchain network you're using
- `OWNER`: Your main wallet address where you want the redeemed assets sent back to

### 3. Configure vault address

Open `constant.ts` and update the vault address:

```typescript
export const VAULT = '0xYourVaultAddress'
```

**Example**: For the K3 USDT Earn Vault on Avalanche, use:
```typescript
export const VAULT = '0xE1A62FDcC6666847d5EA752634E45e134B2F824B'
```

### 4. Get your bot address and transfer tokens

Now you're ready to run the bot for the first time to discover your bot's wallet address.

Start the script with `pnpm start`, and you'll see output like this:

```
🚀 Auto-redeem rescue script starting...
Vault: 0xE1A62FDcC6666847d5EA752634E45e134B2F824B
Recipient: 0x8f40b86eCc96D5a381F938775BF4257d65370Bd4
Operator: 0x66ae9d415DCD4DaD9425B485Bd82D8c2A2F829F9

[2025-11-06T01:53:27.631Z] Checking vault for address: 0x66ae9d415DCD4DaD9425B485Bd82D8c2A2F829F9
```

**Important**: The `Operator` address (in this example `0x66ae9d415DCD4DaD9425B485Bd82D8c2A2F829F9`) is your bot's wallet address.

**What to do:**
1. Copy your bot's wallet address from the `Operator` line in the logs
2. Transfer your vault share tokens to this address
3. Also send a small amount of AVAX (or native token) for gas fees
4. The bot will automatically detect the shares and start attempting to redeem them
5. Watch the logs - you'll see the "Balance" increase after the transfer completes


## How to Run

Start the bot with:

```bash
pnpm start
```

The script will:
- Display your bot's wallet address (Operator)
- Check every 1 second for available liquidity
- Automatically redeem shares when liquidity is available
- Send redeemed assets to your main wallet (OWNER address)

**To stop the bot**: Press `Ctrl+C`

## Changing Networks

If you want to use a different network, update `client.ts`:

```typescript
import { mainnet } from 'viem/chains'; // Import your desired chain

// Update both clients with the new chain
export const publicClient = createPublicClient({
  chain: mainnet, // Change this to your network
  transport: http(process.env.RPC_URL),
});

export const walletClient = createWalletClient({
  account,
  chain: mainnet, // Change this to your network
  transport: http(process.env.RPC_URL),
});
```

Any network supported by viem can be used. See the [viem chains documentation](https://viem.sh/docs/chains/introduction) for all available networks.
