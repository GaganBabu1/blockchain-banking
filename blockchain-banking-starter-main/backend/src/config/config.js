import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/blockchain-banking',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  
  // Email Configuration
  emailService: process.env.EMAIL_SERVICE || 'gmail',
  emailUser: process.env.EMAIL_USER || 'your-email@gmail.com',
  emailPassword: process.env.EMAIL_PASSWORD || 'your-app-password',
  
  // Blockchain Configuration
  blockchainRPC: process.env.BLOCKCHAIN_RPC || 'http://localhost:8545',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  privateKey: process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000',
  chainId: process.env.CHAIN_ID || 1,
  
  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080'
};
