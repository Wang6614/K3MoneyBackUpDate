import 'dotenv/config';
import { publicClient, walletClient, account } from './client';
import { VAULT, OWNER } from './constant';
import { abi } from './abi';

type Address = `0x${string}`;

const INTERVAL_MS = 1000; // Try every 1 second
const SAME_WINDOW_MS = 10_000; // 10 seconds
let lastAttemptTime = 0;
let lastSharesSeen = 0n;

// === 阈值：50 USDT ===
// vault 是 6 decimals → 50 * 10^6 = 50_000_000
const MIN_REDEEM_AMOUNT = 50_000_000n;

async function attemptRedeem() {
  try {
    const botAddress = account.address;
    console.log(`\n[${new Date().toISOString()}] Checking vault for address: ${botAddress}`);

    const [balance, maxRedeemable] = await Promise.all([
      publicClient.readContract({
        address: VAULT as Address,
        abi,
        functionName: 'balanceOf',
        args: [botAddress],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: VAULT as Address,
        abi,
        functionName: 'maxRedeem',
        args: [botAddress],
      }) as Promise<bigint>,
    ]);

    console.log(`Balance: ${balance.toString()}`);
    console.log(`Max Redeemable: ${maxRedeemable.toString()}`);

    const sharesToRedeem = balance < maxRedeemable ? balance : maxRedeemable;

    // ⭐==== 新增逻辑：MaxRedeemable < 50 USDT，直接跳过 ====⭐
    if (sharesToRedeem < MIN_REDEEM_AMOUNT) {
      console.log(`⏩ Skip: redeemable ${sharesToRedeem.toString()} < 50u`);
      return;
    }

    if (sharesToRedeem > 0n) {
      const now = Date.now();

      if (
        lastSharesSeen > 0n &&
        sharesToRedeem <= lastSharesSeen &&
        now - lastAttemptTime < SAME_WINDOW_MS
      ) {
        console.log(`⚠️ Skip: shares=${sharesToRedeem.toString()} <= last=${lastSharesSeen.toString()} (within 10s)`);
        return;
      }

      lastSharesSeen = sharesToRedeem;
      lastAttemptTime = now;

      console.log(`\n🎯 Found ${sharesToRedeem.toString()} shares to redeem!`);
      console.log(`Attempting to redeem to recipient: ${OWNER}`);

      const GAS_PRICE = 5_000_000_000_000n; // 1200 gwei

      const hash = await walletClient.writeContract({
        address: VAULT as Address,
        abi,
        functionName: 'redeem',
        args: [sharesToRedeem, OWNER, botAddress],
        gasPrice: GAS_PRICE,
      });

      console.log(`✅ Tx sent! Hash: ${hash}`);
      console.log(`Waiting for confirmation...`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
      } else {
        console.log(`❌ Transaction failed`);
      }
    } else {
      console.log('No shares available to redeem.');
      lastSharesSeen = 0n;
    }
  } catch (error) {
    console.error('Error during redeem attempt:', error);
  }
}

async function main() {
  console.log('🚀 Auto-redeem rescue script starting...');
  console.log(`Vault: ${VAULT}`);
  console.log(`Recipient: ${OWNER}`);
  console.log(`Operator: ${account.address}`);
  console.log(`Check interval: ${INTERVAL_MS}ms\n`);

  await attemptRedeem();

  setInterval(attemptRedeem, INTERVAL_MS);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
