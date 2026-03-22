import mongoose from 'mongoose';
import { Withdrawal } from './src/models/Withdrawal.js';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/banking');
    
    const flagged = await Withdrawal.find({ riskScore: { $gte: 0.7 } });
    
    console.log(`\n✅ Found ${flagged.length} flagged withdrawals:`);
    flagged.slice(0, 3).forEach((w, i) => {
      console.log(`\n${i+1}. Amount: ₹${w.amount}, Risk: ${(w.riskScore*100).toFixed(0)}%, Status: ${w.fraudStatus}`);
    });
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

test();
