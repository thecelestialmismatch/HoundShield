/**
 * Blockchain Anchor Service — Kaelus.online
 *
 * Anchors compliance event hashes to Base L2 (Coinbase's Ethereum L2)
 * for tamper-proof audit evidence. Cost: ~$0.001 per transaction.
 *
 * Architecture:
 *   1. SHA-256 hash of compliance event → stored in Supabase
 *   2. Hash anchored to Base L2 via a simple data transaction
 *   3. Transaction hash stored back in Supabase for verification
 *
 * This is an ADDITIVE layer — the existing SHA-256 seed anchor
 * in lib/audit/seed-anchor.ts continues to work independently.
 * Blockchain anchoring provides external, immutable proof.
 */

import { createPublicClient, createWalletClient, http, toHex } from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// ── Types ────────────────────────────────────────────────────────────

export interface AnchorResult {
  txHash: string;
  chain: "base" | "base-sepolia";
  blockNumber: bigint | null;
  timestamp: string;
  eventHash: string;
}

export interface AnchorVerification {
  verified: boolean;
  txHash: string;
  chain: string;
  onChainData: string | null;
  expectedHash: string;
  blockNumber: bigint | null;
  blockTimestamp: bigint | null;
}

// ── Configuration ────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const CHAIN = IS_PRODUCTION ? base : baseSepolia;
const RPC_URL = IS_PRODUCTION
  ? process.env.BASE_RPC_URL || "https://mainnet.base.org"
  : process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

function getAnchorAccount() {
  const key = process.env.BLOCKCHAIN_ANCHOR_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "BLOCKCHAIN_ANCHOR_PRIVATE_KEY not set. Blockchain anchoring disabled."
    );
  }
  return privateKeyToAccount(key as `0x${string}`);
}

// ── Clients ──────────────────────────────────────────────────────────

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

function getWalletClient() {
  const account = getAnchorAccount();
  return createWalletClient({
    account,
    chain: CHAIN,
    transport: http(RPC_URL),
  });
}

// ── Core Functions ───────────────────────────────────────────────────

/**
 * Anchor a compliance event hash to Base L2.
 *
 * Sends a zero-value transaction with the event hash as calldata.
 * The hash is permanently stored on-chain as immutable evidence.
 */
export async function anchorToBlockchain(
  eventHash: string
): Promise<AnchorResult> {
  const wallet = getWalletClient();
  const account = getAnchorAccount();

  // Prefix the hash with "KAELUS:" for easy on-chain identification
  const data = toHex(`KAELUS:${eventHash}`);

  // Send zero-value transaction to self with hash as data
  const txHash = await wallet.sendTransaction({
    to: account.address,
    value: 0n,
    data: data as `0x${string}`,
  });

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  return {
    txHash,
    chain: IS_PRODUCTION ? "base" : "base-sepolia",
    blockNumber: receipt.blockNumber,
    timestamp: new Date().toISOString(),
    eventHash,
  };
}

/**
 * Verify that a compliance event hash exists on-chain.
 *
 * Reads the transaction calldata and compares it to the expected hash.
 */
export async function verifyOnChain(
  txHash: string,
  expectedHash: string
): Promise<AnchorVerification> {
  try {
    const tx = await publicClient.getTransaction({
      hash: txHash as `0x${string}`,
    });

    // Decode the calldata
    const onChainData = tx.input
      ? Buffer.from(tx.input.slice(2), "hex").toString("utf-8")
      : null;

    const expectedOnChain = `KAELUS:${expectedHash}`;
    const verified = onChainData === expectedOnChain;

    // Get block timestamp
    let blockTimestamp: bigint | null = null;
    if (tx.blockNumber) {
      const block = await publicClient.getBlock({
        blockNumber: tx.blockNumber,
      });
      blockTimestamp = block.timestamp;
    }

    return {
      verified,
      txHash,
      chain: IS_PRODUCTION ? "base" : "base-sepolia",
      onChainData,
      expectedHash,
      blockNumber: tx.blockNumber,
      blockTimestamp,
    };
  } catch (error) {
    return {
      verified: false,
      txHash,
      chain: IS_PRODUCTION ? "base" : "base-sepolia",
      onChainData: null,
      expectedHash,
      blockNumber: null,
      blockTimestamp: null,
    };
  }
}

/**
 * Check if blockchain anchoring is available (private key configured).
 */
export function isBlockchainEnabled(): boolean {
  return !!process.env.BLOCKCHAIN_ANCHOR_PRIVATE_KEY;
}

/**
 * Get the anchor wallet address (for funding instructions).
 */
export function getAnchorAddress(): string | null {
  try {
    const account = getAnchorAccount();
    return account.address;
  } catch {
    return null;
  }
}
