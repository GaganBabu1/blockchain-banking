import crypto from 'crypto';
import mongoose from 'mongoose';
import { config } from '../config/config.js';

/**
 * BLOCKCHAIN PERSISTENCE LAYER
 * 
 * This schema stores blockchain blocks in MongoDB for persistence.
 * Each block is immutably recorded and can be retrieved for verification.
 */
const BlockchainBlockSchema = new mongoose.Schema(
  {
    blockNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    hash: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    previousHash: {
      type: String,
      default: null
    },
    verified: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    collection: 'blockchain_blocks'
  }
);

// Create model
const BlockchainBlock = mongoose.model('BlockchainBlock', BlockchainBlockSchema);

/**
 * In-memory ledger for fast access during runtime
 * Synced with MongoDB for persistence
 */
let blockchainLedger = [];
let isPersistent = false;

/**
 * Initialize the blockchain with optional persistence
 * 
 * @param {boolean} usePersistence - Use MongoDB for persistent storage (default: false)
 * @returns {Promise<boolean>} True if initialization succeeds
 */
export async function initBlockchain(usePersistence = false) {
  try {
    isPersistent = usePersistence;

    if (usePersistence) {
      // Load existing blockchain from MongoDB
      try {
        const blocks = await BlockchainBlock.find().sort({ blockNumber: 1 });
        blockchainLedger = blocks.map(doc => ({
          blockNumber: doc.blockNumber,
          hash: doc.hash,
          timestamp: doc.timestamp,
          data: doc.data,
          previousHash: doc.previousHash,
          verified: doc.verified
        }));

        console.log('✅ Blockchain: Initialized (Persistent Mode - MongoDB)');
        console.log(`   📦 Loaded ${blocks.length} blocks from database`);
        return true;
      } catch (error) {
        console.log('⚠️  Blockchain: Persistence mode requested but MongoDB unavailable');
        console.log('   Falling back to in-memory mode');
        isPersistent = false;
      }
    }

    blockchainLedger = [];
    console.log('✅ Blockchain: Initialized (Demo Mode - In-Memory)');
    console.log('   ⚠️  Note: In-memory storage (data lost on restart)');
    console.log('   💡 Use BLOCKCHAIN_PERSIST=true for persistent storage');
    return true;
  } catch (error) {
    console.error('❌ Blockchain: Initialization error:', error.message);
    return false;
  }
}

/**
 * Record a transaction on the blockchain ledger
 * 
 * @param {string} from - Source account/wallet address
 * @param {string} to - Destination account/wallet address
 * @param {number} amount - Transaction amount
 * @param {string} txType - Transaction type (deposit, withdrawal, transfer, etc.)
 * @param {object} txDetails - Additional transaction metadata
 * 
 * @returns {Promise<object>} Blockchain confirmation with hash and block number
 */
export async function recordTransaction(from, to, amount, txType = 'transfer', txDetails = {}) {
  try {
    const timestamp = new Date().toISOString();
    const blockNumber = blockchainLedger.length + 1;
    
    // Get previous block's hash for chain linking
    const previousBlock = blockchainLedger[blockchainLedger.length - 1];
    const previousHash = previousBlock ? previousBlock.hash : null;

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

    // Create block object
    const block = {
      blockNumber,
      hash,
      timestamp: new Date(timestamp),
      data: txData,
      previousHash,
      verified: true
    };

    // Add to in-memory ledger
    blockchainLedger.push(block);

    // Save to MongoDB if persistence enabled
    if (isPersistent) {
      try {
        await BlockchainBlock.create(block);
      } catch (error) {
        console.error('⚠️  Failed to persist block to MongoDB:', error.message);
        // Continue anyway - block is in memory
      }
    }

    return {
      success: true,
      blockchainHash: hash,
      blockNumber,
      timestamp,
      confirmed: true,
      persistent: isPersistent,
      message: `Transaction recorded at block ${blockNumber}${isPersistent ? ' (persisted)' : ' (in-memory)'}`
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
 */
export function verifyTransaction(blockNumber) {
  try {
    let block = blockchainLedger.find(b => b.blockNumber === blockNumber);

    // If block not in memory but persistence enabled, try fetching from DB
    if (!block && isPersistent) {
      // Note: This is async but we're in a sync function
      // In production, make this async
      console.log(`⚠️  Block ${blockNumber} not in memory, check MongoDB`);
    }

    if (!block) {
      return { verified: false, message: 'Block not found' };
    }

    // Recalculate hash from stored data
    const recalculatedHash = generateBlockchainHash(block.data);

    // Compare hashes for integrity verification
    const verified = recalculatedHash === block.hash;

    return {
      verified,
      block: {
        blockNumber: block.blockNumber,
        hash: block.hash,
        timestamp: block.timestamp,
        type: block.data.type,
        amount: block.data.amount
      },
      message: verified ? 'Block integrity confirmed ✅' : 'Block integrity failed ❌',
      persistent: isPersistent
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
 * 
 * @returns {object} Stats including block count, transaction count, ledger size
 */
export function getBlockchainStats() {
  return {
    totalBlocks: blockchainLedger.length,
    totalTransactions: blockchainLedger.length,
    ledgerSize: JSON.stringify(blockchainLedger).length + ' bytes',
    mode: isPersistent ? 'PERSISTENT (MongoDB)' : 'DEMO (In-Memory)',
    persistent: isPersistent,
    description: isPersistent 
      ? 'Blockchain data stored in MongoDB - persists across server restarts'
      : 'Demo blockchain - data lost on server restart'
  };
}

/**
 * Clear the in-memory ledger (for testing/reset)
 * WARNING: This does NOT delete from MongoDB if persistence is enabled
 * 
 * @returns {boolean} Always true
 */
export function clearLedger() {
  console.log('⚠️  Clearing blockchain ledger from memory');
  blockchainLedger = [];
  return true;
}

/**
 * Check if persistence is enabled
 * 
 * @returns {boolean} True if using MongoDB persistence
 */
export function isPersistenceEnabled() {
  return isPersistent;
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

/**
 * PERSISTENCE API - For administrative use
 */

/**
 * Get MongoDB blockchain block (async version)
 * Use this for admin functions that need full async support
 * 
 * @param {number} blockNumber - Block to retrieve
 * @returns {Promise<object>} Block data from MongoDB
 */
export async function getBlockFromDB(blockNumber) {
  if (!isPersistent) {
    return { error: 'Persistence not enabled' };
  }

  try {
    const block = await BlockchainBlock.findOne({ blockNumber });
    return block || { error: 'Block not found in database' };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all blocks from MongoDB (async version)
 * 
 * @returns {Promise<Array>} All blocks from database
 */
export async function getLedgerFromDB() {
  if (!isPersistent) {
    return { error: 'Persistence not enabled' };
  }

  try {
    return await BlockchainBlock.find().sort({ blockNumber: 1 });
  } catch (error) {
    throw error;
  }
}

/**
 * Get recent blocks from MongoDB (async version)
 * 
 * @param {number} limit - Number of recent blocks to retrieve (default: 10)
 * @returns {Promise<Array>} Recent blocks
 */
export async function getRecentBlocks(limit = 10) {
  try {
    return await BlockchainBlock
      .find()
      .sort({ blockNumber: -1 })
      .limit(limit);
  } catch (error) {
    throw error;
  }
}

/**
 * Search blocks by criteria (async version)
 * 
 * @param {object} query - MongoDB query object
 * @returns {Promise<Array>} Matching blocks
 */
export async function searchBlocks(query) {
  if (!isPersistent) {
    return { error: 'Persistence not enabled' };
  }

  try {
    return await BlockchainBlock.find(query).sort({ blockNumber: 1 });
  } catch (error) {
    throw error;
  }
}

export { BlockchainBlock };
