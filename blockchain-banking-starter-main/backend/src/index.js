import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config.js';
import { connectDB } from './config/database.js';
import specs from './config/swagger.js';
import { initBlockchain } from './services/blockchainServiceWithPersistence.js';
import { initEmailService } from './services/emailService.js';
import { errorHandler, notFound } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import depositWithdrawalRoutes from './routes/depositWithdrawalRoutes.js';
import disputeSuspensionRoutes from './routes/disputeSuspensionRoutes.js';
import reportingRoutes from './routes/reportingRoutes.js';
import fraudDetectionRoutes from './routes/fraudDetectionRoutes.js';
import creditScoringRoutes from './routes/creditScoringRoutes.js';
import spendingAnalyticsRoutes from './routes/spendingAnalyticsRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://127.0.0.1:8080', 'http://127.0.0.1:8081'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static content
app.use('/uploads', express.static('uploads'));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { 
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blockchain Banking API - Running',
    docs: 'http://localhost:5000/api-docs'
  });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api', depositWithdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', disputeSuspensionRoutes);
app.use('/api', reportingRoutes);
app.use('/api/fraud', fraudDetectionRoutes);
app.use('/api/credit', creditScoringRoutes);
app.use('/api/spending', spendingAnalyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize services
    // Enable blockchain persistence to MongoDB (data survives server restarts)
    await initBlockchain(true);
    await initEmailService();

    // Start listening
    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║     BLOCKCHAIN BANKING - BACKEND SERVER STARTED           ║
║     Server running at: http://localhost:${config.port}         ║
║     MongoDB: Connected                                    ║
║     Blockchain: Initialized                               ║
║     Email Service: Ready                                  ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

export default app;
