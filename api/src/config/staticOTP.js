/**
 * Static OTP Configuration
 * 
 * This configuration disables SMS service and uses a static OTP for all logins.
 * Perfect for development and testing without needing SMS service setup.
 */

module.exports = {
  // Static OTP for all logins (change this value to use a different OTP)
  STATIC_OTP: '123456',
  
  // OTP expiry time in minutes
  OTP_EXPIRY_MINUTES: 10,
  
  // Always use static OTP (SMS service disabled for testing)
  USE_STATIC_OTP: true,
  
  // Maximum OTP attempts per day
  MAX_OTP_ATTEMPTS: 5,
  
  // Minimum interval between OTP requests in seconds
  OTP_RATE_LIMIT_SECONDS: 60,
  
  // SMS service disabled for testing
  SMS_ENABLED: false
};