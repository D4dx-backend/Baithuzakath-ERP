const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  API_VERSION: process.env.API_VERSION || 'v1',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath',
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/baithuzzakath_test',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  // DXing SMS Service
  DXING_API_KEY: process.env.DXING_API_KEY,
  DXING_BASE_URL: process.env.DXING_BASE_URL || 'https://dxing.net/dxapi',
  DXING_SENDER_ID: process.env.DXING_SENDER_ID || 'BZKRLA',
  DXING_OTP_TEMPLATE_ID: process.env.DXING_OTP_TEMPLATE_ID,
  DXING_NOTIFICATION_TEMPLATE_ID: process.env.DXING_NOTIFICATION_TEMPLATE_ID,

  // DXing WhatsApp (optional)
  DXING_WHATSAPP_ENABLED: process.env.DXING_WHATSAPP_ENABLED === 'true',
  DXING_WHATSAPP_SEND_PATH: process.env.DXING_WHATSAPP_SEND_PATH || '/whatsapp/send',
  DXING_WHATSAPP_TEMPLATE_ID: process.env.DXING_WHATSAPP_TEMPLATE_ID,
  
  // Email Service
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // File Upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10485760, // 10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx',
  
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/app.log'
};