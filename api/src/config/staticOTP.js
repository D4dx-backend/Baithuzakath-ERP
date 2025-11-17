/**
 * OTP Service Configuration
 * 
 * Supports multiple OTP delivery methods:
 * - Static OTP (for development/testing)
 * - WhatsApp OTP (via DXing API) - PRODUCTION
 * - SMS OTP (via DXing SMS API)
 * 
 * Configuration priority:
 * 1. If USE_STATIC_OTP = true, uses static OTP (ignores other services)
 * 2. If USE_WHATSAPP_OTP = true, sends OTP via WhatsApp
 * 3. If SMS_ENABLED = true, sends OTP via SMS
 * 
 * Auto-detection based on NODE_ENV:
 * - development: Uses static OTP (free, instant testing)
 * - production: Uses WhatsApp OTP via DXing API (real messages)
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  // Static OTP for all logins (for development/testing)
  STATIC_OTP: '123456',
  
  // OTP expiry time in minutes
  OTP_EXPIRY_MINUTES: 10,
  
  // Toggle static OTP mode based on environment
  // development: true (static OTP), production: false (WhatsApp OTP)
  USE_STATIC_OTP: isDevelopment,
  
  // WhatsApp OTP service (via DXing WhatsApp API)
  // development: false, production: true
  USE_WHATSAPP_OTP: isProduction,
  WHATSAPP_ENABLED: isProduction,
  
  // SMS OTP service (via DXing SMS API) - fallback if WhatsApp fails
  SMS_ENABLED: false,
  
  // Maximum OTP attempts per day
  MAX_OTP_ATTEMPTS: 5,
  
  // Minimum interval between OTP requests in seconds
  OTP_RATE_LIMIT_SECONDS: 60
};