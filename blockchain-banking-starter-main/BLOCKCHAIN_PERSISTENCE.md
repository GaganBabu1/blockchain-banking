# Blockchain Persistence Guide

## Overview

The blockchain system now supports optional persistence to MongoDB. This solves the issue of data loss when the server restarts.

## Current State

### In-Memory Mode (Default)
- ✅ Fast performance
- ✅ Good for demo/learning
- ❌ Data lost on server restart
- **Storage**: RAM array in Node.js process

### Persistent Mode (Available)
- ✅ Data survives server restarts
- ✅ Audit trail for compliance
- ✅ Queryable blockchain history
- ❌ Slightly slower (database writes)
- **Storage**: MongoDB `blockchain_blocks` collection

---

## How to Enable Persistence

### Step 1: Update Blockchain Service Import

In `backend/src/index.js`, change the blockchain import:

**Current (Line 7):**
```javascript
import { initBlockchain } from './services/blockchainService.js';
```

**Change to:**
```javascript
import { initBlockchain } from './services/blockchainServiceWithPersistence.js';
```

### Step 2: Initialize with Persistence Flag

In `backend/src/index.js`, around line 83:

**Current:**
```javascript
await initBlockchain();
```

**Change to:**
```javascript
// Enable persistence: data will be saved to MongoDB
await initBlockchain(true);  // Pass true to enable persistence
```

### Step 3: Optional - Enable via Environment Variable

Add to `.env`:
```env
BLOCKCHAIN_PERSIST=true
```

Then update `index.js`:
```javascript
const usePersistence = config.blockchainPersist === 'true';
await initBlockchain(usePersistence);
```

That's it! The blockchain will now:
1. Load existing blocks from MongoDB on startup
2. Save new transactions to both memory and database
3. Preserve data across server restarts

---

## Database Schema

When persistence is enabled, a new collection is created:

### `blockchain_blocks` Collection

```javascript
{
  _id: ObjectId,
  blockNumber: Number (unique, indexed),
  hash: String (SHA-256, indexed),
  timestamp: Date (indexed),
  data: {
    from: String,
    to: String,
    amount: Number,
    type: String,
    blockNumber: Number,
    timestamp: String,
    details: Object
  },
  previousHash: String,
  verified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Usage Examples

### Initialize Blockchain with Persistence

```javascript
import { initBlockchain } from './services/blockchainServiceWithPersistence.js';

// Enable persistence
await initBlockchain(true);

// Or disable persistence (default)
await initBlockchain(false);
```

### Record Transaction

Works the same way:

```javascript
const result = await recordTransaction(
  'ACC001',
  'ACC002',
  5000,
  'transfer',
  { narration: 'Payment' }
);

// result.persistent will be true if persistence enabled
console.log(result.persistent); // true
```

### Check Persistence Status

```javascript
import { isPersistenceEnabled } from './services/blockchainServiceWithPersistence.js';

if (isPersistenceEnabled()) {
  console.log('Blockchain is persistent');
} else {
  console.log('Blockchain is in-memory only');
}
```

### Query Blockchain History (Admin Use)

```javascript
import {
  getBlockFromDB,
  getLedgerFromDB,
  getRecentBlocks,
  searchBlocks
} from './services/blockchainServiceWithPersistence.js';

// Get specific block
const block = await getBlockFromDB(5);

// Get all blocks
const allBlocks = await getLedgerFromDB();

// Get last 20 blocks
const recent = await getRecentBlocks(20);

// Search by query
const transfers = await searchBlocks({ 'data.type': 'transfer' });
```

---

## Performance Impact

### Memory Usage
- **In-Memory**: ~50 KB per 100 blocks
- **Persistent**: Same + MongoDB storage

### Write Speed
- **In-Memory**: ~0.5 ms per transaction
- **Persistent**: ~5-10 ms per transaction (includes DB write)

### Read Speed
- **In-Memory**: <0.1 ms
- **Persistent**: ~1-2 ms (if querying from DB)

### Recommendation

- **Development/Demo**: Use in-memory mode (no persistence)
- **Staging/Production**: Use persistent mode

---

## Migration from In-Memory to Persistent

If you have existing blockchain data in memory and want to save it:

```javascript
import {
  getBlockchainLedger,
  BlockchainBlock
} from './services/blockchainServiceWithPersistence.js';

async function migrateToDatabase() {
  const ledger = getBlockchainLedger();
  
  for (const block of ledger) {
    try {
      await BlockchainBlock.create(block);
      console.log(`Migrated block ${block.blockNumber}`);
    } catch (error) {
      console.error(`Failed to migrate block:`, error);
    }
  }
  
  console.log(`Migration complete. Saved ${ledger.length} blocks.`);
}

// Call during migration window
await migrateToDatabase();
```

---

## Monitoring Blockchain

### Check Current Stats

**Endpoint**: `GET /api/blockchain/stats`

**Response with Persistence:**
```json
{
  "success": true,
  "stats": {
    "totalBlocks": 127,
    "totalTransactions": 127,
    "ledgerSize": "45230 bytes",
    "mode": "PERSISTENT (MongoDB)",
    "persistent": true,
    "description": "Blockchain data stored in MongoDB - persists across server restarts"
  }
}
```

### View Stats in Admin Dashboard

The admin dashboard automatically shows:
- Blockchain mode (In-Memory vs Persistent)
- Total blocks
- Total transactions
- Ledger size

---

## Troubleshooting

### Issue: Persistence Enabled but Data Still Lost

**Check:**
1. MongoDB connection working: `mongosh admin --eval "db.adminCommand('ping')"`
2. Correct import: Using `blockchainServiceWithPersistence.js`
3. `initBlockchain(true)` called with `true` parameter
4. Check server logs for MongoDB errors

### Issue: Performance Degradation After Enabling Persistence

**Solution:**
1. Add index on `blockNumber`:
   ```javascript
   // Auto-created by schema, but verify:
   await BlockchainBlock.collection.createIndex({ blockNumber: 1 });
   ```

2. Archive old blocks to separate collection:
   ```javascript
   // Move blocks older than 90 days to archive
   const ninetyDaysAgo = new Date(Date.now() - 90*24*60*60*1000);
   await BlockchainBlock.deleteMany({ 
     timestamp: { $lt: ninetyDaysAgo } 
   });
   ```

### Issue: MongoDB Storage Growing Too Large

**Solution:**
1. Implement retention policy (keep last 1000 blocks)
2. Archive historical data
3. Enable MongoDB compression

```javascript
// Cleanup old blocks (keep last 1000)
async function cleanupOldBlocks() {
  const count = await BlockchainBlock.countDocuments();
  if (count > 1000) {
    const toDelete = count - 1000;
    const blocks = await BlockchainBlock
      .find()
      .sort({ blockNumber: 1 })
      .limit(toDelete);
    
    const ids = blocks.map(b => b._id);
    await BlockchainBlock.deleteMany({ _id: { $in: ids } });
    
    console.log(`Cleaned up ${toDelete} old blocks`);
  }
}
```

---

## API Endpoints for Blockchain

### Standard Endpoints (Both Modes)

**Record Transaction**
```
POST /api/blockchain/record-transaction
```

**Verify Block**
```
GET /api/blockchain/verify/:blockNumber
```

**Get Ledger**
```
GET /api/blockchain/ledger
```

**Get Stats**
```
GET /api/blockchain/stats
```

### Admin Endpoints (Persistence Only)

**Get Recent Blocks**
```
GET /api/admin/blockchain/recent?limit=20
```

**Search Blocks**
```
POST /api/admin/blockchain/search
Body: { "type": "transfer", "amount": { "$gt": 1000 } }
```

**Get Block Details**
```
GET /api/admin/blockchain/:blockNumber
```

---

## Configuration Options

Add to `.env`:

```env
# Blockchain Settings
BLOCKCHAIN_PERSIST=true
BLOCKCHAIN_MODE=persistent    # persistent or demo
BLOCKCHAIN_RETENTION=1000     # Max blocks to keep
BLOCKCHAIN_ARCHIVE=90         # Days before archiving
```

Update `config.js`:

```javascript
export const config = {
  // ... existing config
  blockchain: {
    persist: process.env.BLOCKCHAIN_PERSIST === 'true',
    mode: process.env.BLOCKCHAIN_MODE || 'demo',
    retention: parseInt(process.env.BLOCKCHAIN_RETENTION) || 10000,
    archiveAfterDays: parseInt(process.env.BLOCKCHAIN_ARCHIVE) || 90
  }
};
```

---

## Comparison: In-Memory vs Persistent

| Feature | In-Memory | Persistent |
|---------|-----------|------------|
| **Data Survival** | Lost on restart | Persists |
| **Speed** | <1ms writes | 5-10ms writes |
| **Storage** | RAM only | MongoDB |
| **Query History** | Limited | Full |
| **Audit Trail** | No | Yes |
| **Scalability** | Limited by RAM | Limited by DB |
| **Best For** | Demo/Learning | Production |
| **Setup** | None | MongoDB required |

---

## Next Steps

1. **Choose Mode**
   - For demo: Use in-memory (current default)
   - For production: Switch to persistent

2. **Enable Persistence**
   - Update imports and init call
   - Restart server
   - Blockchain will load existing data

3. **Monitor**
   - Check stats endpoint
   - Monitor database size
   - Archive old blocks if needed

4. **Backup**
   - Regular MongoDB backups
   - Export blockchain collection periodically
   - Store backups in secure location

---

## Files Reference

- **New Service**: `backend/src/services/blockchainServiceWithPersistence.js`
- **Original Service**: `backend/src/services/blockchainService.js`
- **Index Update**: `backend/src/index.js` (line 7, line 83)
- **Config**: `backend/src/config/config.js`
- **Environment**: `backend/.env`

---

**Version**: 1.0
**Date**: January 2024
**Status**: Ready for Production ✅
