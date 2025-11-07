# Static OTP Configuration

This project has been configured to use a **static OTP of `123456`** for all login attempts, with **DXing SMS service completely disabled** for testing.

## Current Configuration

- **Static OTP**: `123456`
- **All users** (admin and beneficiary) will use this same OTP
- **No SMS service**: DXing SMS is completely disabled
- **No external dependencies**: Works without any SMS service configuration
- **Perfect for testing**: No need to configure SMS credentials

## How to Use

1. **Login Process**:
   - Select your role (Admin or Beneficiary)
   - Enter any valid 10-digit phone number (e.g., `9876543210`)
   - Click "Send OTP"
   - The static OTP `123456` will be auto-filled
   - Click "Verify & Login"

2. **Default Test Accounts**:
   ```
   State Admin: Phone 9876543210
   District Admin: Phone 9876543211  
   Area Admin: Phone 9876543212
   Unit Admin: Phone 9876543213
   Beneficiary: Phone 9876543214
   ```

## Configuration Files

### Main Configuration
**File**: `api/src/config/staticOTP.js`
```javascript
module.exports = {
  STATIC_OTP: '123456',           // Change this to use different OTP
  USE_STATIC_OTP: true,           // Set to false to use dynamic OTP
  OTP_EXPIRY_MINUTES: 10,         // OTP validity period
  MAX_OTP_ATTEMPTS: 5,            // Daily limit
  OTP_RATE_LIMIT_SECONDS: 60      // Time between requests
};
```

## How to Change the Static OTP

1. **Edit the configuration file**:
   ```bash
   # Open the config file
   nano api/src/config/staticOTP.js
   
   # Change STATIC_OTP value
   STATIC_OTP: '654321',  // Your new OTP
   ```

2. **Restart the API server**:
   ```bash
   cd api
   npm start
   ```

## SMS Service Status

- **DXing SMS Service**: ❌ **DISABLED**
- **Static OTP Mode**: ✅ **ENABLED**
- **No SMS Configuration Required**: ✅ **Ready to use**

## To Enable SMS Service (Future)

If you want to enable real SMS service later:

1. **Uncomment DXing config** in `api/.env`
2. **Add real SMS credentials**
3. **Update auth service** to re-enable DXing calls
4. **Set `USE_STATIC_OTP: false`** in config

## Frontend Display

The frontend will show:
- **Green box** with "Static OTP: 123456"
- **Auto-filled OTP input** for convenience
- **Message**: "This OTP is always 123456 for all logins"

## Security Note

⚠️ **Important**: This static OTP configuration is intended for development and testing only. For production environments, consider:

1. Using dynamic OTP generation
2. Enabling SMS service
3. Setting `USE_STATIC_OTP: false`
4. Configuring proper SMS credentials

## Files Modified

- `api/src/services/authService.js` - Main authentication logic
- `api/src/controllers/beneficiaryAuthController.js` - Beneficiary auth
- `api/src/models/User.js` - User model OTP generation
- `erp/src/pages/Login.tsx` - Frontend login component
- `api/src/config/staticOTP.js` - Configuration file (new)