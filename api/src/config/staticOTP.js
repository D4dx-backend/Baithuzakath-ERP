/**
 * OTP Service Configuration
 * 
 * Supports multiple OTP delivery methods:
 * - Static OTP (for development/testing ONLY) - configured via USE_STATIC_OTP env var
 * - WhatsApp OTP (via DXing API) - configured via USE_WHATSAPP_OTP env var
 * - SMS OTP (via DXing SMS API) - configured via SMS_ENABLED env var
 * 
 * SECURITY: Static OTP is STRICTLY FORBIDDEN in production mode.
 * If NODE_ENV=production, USE_STATIC_OTP is automatically disabled regardless of env var value.
 * 
 * Configuration priority:
 * 1. If USE_STATIC_OTP = true AND NODE_ENV != 'production', uses static OTP (requires STATIC_OTP env var)
 * 2. If USE_WHATSAPP_OTP = true, sends OTP via WhatsApp
 * 3. If SMS_ENABLED = true, sends OTP via SMS
 * 
 * All configuration values must come from environment variables.
 * No hardcoded defaults are allowed.
 */

const { getOptionalEnvVar } = require('./validateEnv');
const config = require('./environment');

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

// CRITICAL: Get NODE_ENV from validated config (single source of truth)
const NODE_ENV = config.NODE_ENV;

// CRITICAL: Static OTP is FORBIDDEN in production
// Override USE_STATIC_OTP if in production mode, regardless of env var value
const rawUseStaticOTP = getEnvBool('USE_STATIC_OTP', false);
const USE_STATIC_OTP = NODE_ENV === 'production' ? false : rawUseStaticOTP;

// Validate production mode configuration
if (NODE_ENV === 'production') {
  // In production, static OTP must be disabled
  if (rawUseStaticOTP) {
    console.warn('⚠️  SECURITY WARNING: USE_STATIC_OTP=true detected in production mode. Static OTP is automatically disabled for security.');
  }
  
  // In production, at least one real OTP service must be enabled
  const hasRealOTPService = getEnvBool('USE_WHATSAPP_OTP', false) || getEnvBool('SMS_ENABLED', false);
  if (!hasRealOTPService) {
    console.error('❌ PRODUCTION CONFIGURATION ERROR: No real OTP service enabled in production mode.');
    console.error('   Please set USE_WHATSAPP_OTP=true or SMS_ENABLED=true in your production environment.');
    console.error('   Static OTP is not allowed in production for security reasons.');
  }
}

// Log configuration on module load for debugging
if (NODE_ENV === 'development') {
  console.log('🔧 OTP Configuration:');
  console.log(`   - Environment: ${NODE_ENV}`);
  console.log(`   - USE_STATIC_OTP: ${USE_STATIC_OTP} (raw: ${rawUseStaticOTP})`);
  console.log(`   - USE_WHATSAPP_OTP: ${getEnvBool('USE_WHATSAPP_OTP', false)}`);
  console.log(`   - SMS_ENABLED: ${getEnvBool('SMS_ENABLED', false)}`);
}

module.exports = {
  // Static OTP - ONLY available in development mode
  // Automatically disabled in production regardless of env var
  STATIC_OTP: USE_STATIC_OTP ? getOptionalEnvVar('STATIC_OTP') : undefined,
  
  // OTP expiry time in minutes (from environment)
  OTP_EXPIRY_MINUTES: getEnvInt('OTP_EXPIRY_MINUTES', 10),
  
  // Toggle static OTP mode (ENVIRONMENT-AWARE: disabled in production)
  USE_STATIC_OTP: USE_STATIC_OTP,
  
  // Runtime check: Is static OTP allowed in current environment?
  isStaticOTPAllowed: () => NODE_ENV !== 'production',
  
  // Get current environment mode
  NODE_ENV: NODE_ENV,
  
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