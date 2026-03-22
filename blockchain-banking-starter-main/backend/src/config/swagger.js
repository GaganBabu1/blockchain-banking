import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blockchain Banking System API',
      version: '1.0.0',
      description: 'Comprehensive banking system with blockchain integration, 2FA, disputes, suspensions, and advanced reporting',
      contact: {
        name: 'API Support',
        email: 'support@blockchainbanking.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            isAdmin: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            twoFactorEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Account: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            accountNumber: { type: 'string' },
            userId: { type: 'string' },
            balance: { type: 'number' },
            accountType: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'] }
          }
        },
        Deposit: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            accountId: { type: 'string' },
            userId: { type: 'string' },
            amount: { type: 'number' },
            depositMethod: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            referenceNumber: { type: 'string' },
            blockchainHash: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Withdrawal: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            accountId: { type: 'string' },
            userId: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            referenceNumber: { type: 'string' },
            blockchainHash: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Dispute: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            transactionId: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string', enum: ['incorrect_amount', 'unauthorized', 'duplicate', 'other'] },
            status: { type: 'string', enum: ['open', 'investigating', 'resolved', 'closed'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            resolution: { type: 'string' },
            refundAmount: { type: 'number' }
          }
        },
        UserSuspension: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            reason: { type: 'string' },
            severity: { type: 'string', enum: ['warning', 'temporary', 'permanent'] },
            isSuspended: { type: 'boolean' },
            suspendedAt: { type: 'string', format: 'date-time' },
            suspendedUntil: { type: 'string', format: 'date-time' },
            suspendedBy: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [
    './src/routes/authRoutes.js',
    './src/routes/accountRoutes.js',
    './src/routes/kycRoutes.js',
    './src/routes/depositWithdrawalRoutes.js',
    './src/routes/transferRoutes.js',
    './src/routes/adminRoutes.js',
    './src/routes/disputeSuspensionRoutes.js',
    './src/routes/reportingRoutes.js'
  ]
};

const specs = swaggerJsdoc(options);
export default specs;
