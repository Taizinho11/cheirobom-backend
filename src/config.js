require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    backend: process.env.BACKEND_URL || 'http://localhost:3001',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'mollie',
    mollie: {
      apiKey: process.env.MOLLIE_API_KEY,
    },
    sumup: {
      clientId: process.env.SUMUP_CLIENT_ID,
      clientSecret: process.env.SUMUP_CLIENT_SECRET,
      merchantCode: process.env.SUMUP_MERCHANT_CODE,
      payBaseUrl: process.env.SUMUP_PAY_BASE_URL || 'https://pay.sumup.com/b2c/CHANGE_ME',
    },
  },
};
