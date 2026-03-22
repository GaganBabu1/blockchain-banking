import crypto from 'crypto';
import { config } from '../config/config.js';

/**
 * BLOCKCHAIN SERVICE - DEMO MODE
 * 
 * This service implements a simplified blockchain ledger for demonstration purposes.
 * It uses SHA-256 hashing to create immutable transaction records.
 * 
 * ⚠️ IMPORTANT: This is NOT a real blockchain
 * - Data is stored in-memory only (lost on server restart)
 * - Single-node only (no distributed consensus)
 * - No persistence layer
 * - For production: Consider Ethereum, Polygon, or Hyperledger Fabric
 * 
 * Features:
 * - Immutable transaction recording with cryptographic hashing
 * - Transaction verification with hash integrity checks
 * - Ledger statistics and audit trails
 * - Demo-friendly for learning blockchain concepts
 */

let blockchainLedger = [];

/**
 * Initialize the blockchain ledger
 * Called once at server startup to set up the in-memory ledger
 * 
 * @returns {Promise<boolean>} True if initialization succeeds
 */
export async function initBlockchain() {
  try {
    console.log('✅ Blockchain: Initialized (Demo Mode - SHA-256 Hashing)');
    console.log('   ⚠️  Note: In-memory storage (data lost on restart)');
    console.log('   💡 For production, integrate with real blockchain networks');
    blockchainLedger = [];
    return true;
  } catch (error) {
    console.log('⚠️ Blockchain: Error during initialization');
    return false;
  }
}

/**
 * Record a transaction on the blockchain ledger
 * Creates an immutable record with SHA-256 hash
 * 
 * @param {string} from - Source account/wallet address
 * @param {string} to - Destination account/wallet address
 * @param {number} amount - Transaction amount
 * @param {string} txType - Transaction type (deposit, withdrawal, transfer, etc.)
 * @param {object} txDetails - Additional transaction metadata
 * 
 * @returns {Promise<object>} Blockchain confirmation with hash and block number
 * 
 * Example:
 * const result = await recordTransaction(
 *   'ACC001', 
 *   'ACC002', 
 *   5000, 
 *   'transfer', 
 *   { narration: 'Payment' }
 * );
 */
export async function recordTransaction(from, to, amount, txType = 'transfer', txDetails = {}) {
  try {
    const timestamp = new Date().toISOString();
    const blockNumber = blockchainLedger.length + 1;
    
    // Create immutable transaction data
    const txData = {
      from,
      to,
      amount,
      type: txType,
      timestamp,
      blockNumber,
      details: txDetails
    };
    
    // Generate SHA-256 hash for transaction
    const hash = generateBlockchainHash(txData);
    
    // Add block to ledger
    blockchainLedger.push({
      blockNumber,
      hash,              // SHA-256 hash of transaction data
      timestamp,         // Block timestamp
      data: txData       // Full transaction details
    });
    
    return {
      success: true,
      blockchainHash: hash,
      blockNumber,
      timestamp,
      confirmed: true,
      message: `Transaction recorded at block ${blockNumber}`
    };
  } catch (error) {
    console.error('❌ Blockchain transaction error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify a transaction's integrity on the blockchain
 * Recalculates hash and compares with stored hash
 * 
 * @param {number} blockNumber - Block number to verify (1-indexed)
 * 
 * @returns {object} Verification result with block details
 * 
 * Example:
 * const result = verifyTransaction(1);
 * if (result.verified) {
 *   console.log('Block integrity confirmed');
 * }
 */
export function verifyTransaction(blockNumber) {
  try {
    const block = blockchainLedger.find(b => b.blockNumber === blockNumber);
    if (!block) {
      return { verified: false, message: 'Block not found' };
    }
    
    // Recalculate hash from stored data
    const recalculatedHash = generateBlockchainHash(block.data);
    
    // Compare hashes for integrity verification
    const verified = recalculatedHash === block.hash;
    
    return {
      verified,
      block,
      message: verified ? 'Block integrity confirmed ✅' : 'Block integrity failed ❌'
    };
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return { verified: false, error: error.message };
  }
}

/**
 * Get the complete blockchain ledger
 * Returns all recorded blocks in order
 * 
 * @returns {Array} Array of blocks with hashes and transaction data
 */
export function getBlockchainLedger() {
  return blockchainLedger;
}

/**
 * Get blockchain statistics
 * Returns metrics about the ledger
 * 
 * @returns {object} Stats including block count, transaction count, ledger size
 */
export function getBlockchainStats() {
  return {
    totalBlocks: blockchainLedger.length,
    totalTransactions: blockchainLedger.length,  // 1 block = 1 transaction
    ledgerSize: JSON.stringify(blockchainLedger).length + ' bytes',
    mode: 'DEMO (In-Memory)',
    persistent: false,
    description: 'Demo blockchain - data lost on server restart'
  };
}

/**
 * Internal: Generate SHA-256 hash for transaction data
 * Uses Node.js crypto module for hashing
 * 
 * @param {object} data - Transaction data to hash
 * @returns {string} SHA-256 hash in hexadecimal format
 */
function generateBlockchainHash(data) {
  const dataString = JSON.stringify(data);
  return crypto
    .createHash('sha256')
    .update(dataString)
    .digest('hex');
}
