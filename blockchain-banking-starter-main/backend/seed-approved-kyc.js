import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import { KYC } from './src/models/KYC.js';

const mongoUrl = 'mongodb://localhost:27017/blockchain-banking';

async function seedApprovedKyc() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB\n');

    // Find existing users (non-admin)
    const users = await User.find({ isAdmin: false }).limit(3);
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      process.exit(1);
    }

    console.log(`✅ Found ${users.length} users. Approving KYCs...\n`);

    let approved = 0;

    // Approve KYC for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Find or create KYC record
      let kyc = await KYC.findOne({ userId: user._id });

      if (!kyc) {
        kyc = new KYC({
          userId: user._id,
          status: 'not_submitted'
        });
      }

      // Generate realistic document details
      const documentTypes = ['aadhar', 'pan', 'passport', 'license'];
      const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
      
      let docNumber;
      if (docType === 'aadhar') {
        docNumber = Math.random().toString().slice(2, 14); // 12 digits
      } else if (docType === 'pan') {
        docNumber = 'ABCDE1234F';
      } else if (docType === 'passport') {
        docNumber = 'P' + Math.random().toString().slice(2, 9);
      } else {
        docNumber = 'DL' + Math.random().toString().slice(2, 9);
      }

      // Update KYC with approved details
      kyc.documentType = docType;
      kyc.documentNumber = docNumber;
      kyc.documentFileName = `kyc_${user._id}_${Date.now()}.pdf`;
      kyc.documentFileSize = Math.floor(Math.random() * 500000) + 50000; // 50KB to 550KB
      kyc.documentMimeType = 'application/pdf';
      kyc.status = 'approved'; // APPROVED
      kyc.submittedAt = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000); // Last 5 days
      kyc.verifiedAt = new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000); // Last 3 days
      kyc.monthlyLimit = 1000000; // ₹10 lakhs
      kyc.dailyLimit = 100000; // ₹1 lakh
      kyc.verificationNotes = 'Documents verified and approved.';

      await kyc.save();

      // Sync user status
      await User.findByIdAndUpdate(user._id, { kycStatus: 'approved' });

      approved++;
      console.log(`✅ KYC ${approved}: ${user.name} (${user.email})`);
      console.log(`   • Document Type: ${docType.toUpperCase()}`);
      console.log(`   • Document Number: ${docNumber}`);
      console.log(`   • Status: APPROVED`);
      console.log(`   • Monthly Limit: ₹10,00,000`);
      console.log(`   • Daily Limit: ₹1,00,000\n`);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ KYC SEEDING COMPLETE!`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📊 Statistics:`);
    console.log(`   • Total Users: ${users.length}`);
    console.log(`   • Total KYCs Approved: ${approved}`);
    console.log(`   • All users now have: APPROVED status`);
    console.log(`\n📁 Check MongoDB:`);
    console.log(`   • Collection: kycs (status='approved')`);
    console.log(`   • Collection: users (kycStatus='approved')\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding KYC data:', error.message);
    process.exit(1);
  }
}

seedApprovedKyc();
