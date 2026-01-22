/**
 * OTP Service Configuration
 * 
 * Supports multiple OTP delivery methods:
 * - Static OTP (for development/testing) - configured via USE_STATIC_OTP env var
 * - WhatsApp OTP (via DXing API) - configured via USE_WHATSAPP_OTP env var
 * - SMS OTP (via DXing SMS API) - configured via SMS_ENABLED env var
 * 
 * Configuration priority:
 * 1. If USE_STATIC_OTP = true, uses static OTP (requires STATIC_OTP env var)
 * 2. If USE_WHATSAPP_OTP = true, sends OTP via WhatsApp
 * 3. If SMS_ENABLED = true, sends OTP via SMS
 * 
 * All configuration values must come from environment variables.
 * No hardcoded defaults are allowed.
 */

const { getOptionalEnvVar } = require('./validateEnv');

const getEnvBool = (varName, defaultValue = false) => {
  const value = process.env[varName];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

const getEnvInt = (varName, defaultValue = undefined) => {
  const value = process.env[varName];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

module.exports = {
  // Static OTP - only used if USE_STATIC_OTP=true
  // Must be set in environment if USE_STATIC_OTP=true
  STATIC_OTP: getOptionalEnvVar('STATIC_OTP'),
  
  // OTP expiry time in minutes (from environment)
  OTP_EXPIRY_MINUTES: getEnvInt('OTP_EXPIRY_MINUTES', 10),
  
  // Toggle static OTP mode (from environment)
  USE_STATIC_OTP: getEnvBool('USE_STATIC_OTP', false),
  
  // WhatsApp OTP service (from environment)
  USE_WHATSAPP_OTP: getEnvBool('USE_WHATSAPP_OTP', false),
  WHATSAPP_ENABLED: getEnvBool('WHATSAPP_ENABLED', false),
  
  // SMS OTP service (from environment)
  SMS_ENABLED: getEnvBool('SMS_ENABLED', false),
  
  // Maximum OTP attempts per day (from environment)
  MAX_OTP_ATTEMPTS: getEnvInt('MAX_OTP_ATTEMPTS', 5),
  
  // Minimum interval between OTP requests in seconds (from environment)
  OTP_RATE_LIMIT_SECONDS: getEnvInt('OTP_RATE_LIMIT_SECONDS', 60)
};