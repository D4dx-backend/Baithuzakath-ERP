# Testing Guide - Static OTP Authentication

## ✅ **System Status**

### **Servers Running:**
- **API Server**: `http://localhost:8000` ✅ Running
- **Frontend Server**: `http://localhost:8081` ✅ Running

### **Authentication Configuration:**
- **Static OTP**: `123456` ✅ Enabled
- **SMS Service**: ❌ Disabled (no DXing dependency)
- **Auto-fill OTP**: ✅ Enabled in frontend

## 🧪 **How to Test**

### **1. Admin Login**
1. Go to: `http://localhost:8081/login`
2. Select "Admin Login"
3. Enter phone: `9876543210` (or any 10-digit number starting with 6-9)
4. Click "Send OTP"
5. OTP `123456` will auto-fill
6. Click "Verify & Login"

### **2. Beneficiary Login**
1. Go to: `http://localhost:8081/beneficiary-login`
2. Enter phone: `9876543214` (or any 10-digit number starting with 6-9)
3. Click "Send OTP"
4. OTP `123456` will auto-fill
5. Click "Verify & Login"

### **3. API Testing (Direct)**
```bash
# Test OTP Request
curl -X POST http://localhost:8000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","purpose":"login"}'

# Test OTP Verification
curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456","purpose":"login"}'
```

## 📱 **Default Test Accounts**

| Role | Phone | Email | OTP |
|------|-------|-------|-----|
| State Admin | 9876543210 | admin@baithuzzakath.org | 123456 |
| District Admin | 9876543211 | district.tvm@baithuzzakath.org | 123456 |
| Area Admin | 9876543212 | area.tvmcity@baithuzzakath.org | 123456 |
| Unit Admin | 9876543213 | unit.pettah@baithuzzakath.org | 123456 |
| Beneficiary | 9876543214 | beneficiary@example.com | 123456 |

## 🔧 **Configuration Files**

### **Static OTP Config**: `api/src/config/staticOTP.js`
```javascript
module.exports = {
  STATIC_OTP: '123456',        // Change this to use different OTP
  USE_STATIC_OTP: true,        // Always enabled for testing
  OTP_EXPIRY_MINUTES: 10,      // OTP validity
  SMS_ENABLED: false           // SMS service disabled
};
```

### **API Environment**: `api/.env`
```env
PORT=8000                      # API server port
NODE_ENV=development           # Environment
# DXing SMS configs are commented out (disabled)
```

### **Frontend Environment**: `erp/.env`
```env
VITE_API_URL=http://localhost:8000/api  # Points to correct API
```

## 🚨 **Troubleshooting**

### **Connection Refused Error**
- ✅ **Fixed**: Updated API URL from port 5000 to 8000
- ✅ **Fixed**: Started API server on correct port
- ✅ **Fixed**: Removed DXing SMS dependencies

### **OTP Not Working**
- ✅ **Fixed**: Static OTP `123456` always works
- ✅ **Fixed**: Auto-fill enabled in frontend
- ✅ **Fixed**: No SMS service required

### **Frontend Not Loading**
- ✅ **Fixed**: Frontend running on port 8081
- ✅ **Fixed**: API URL configuration updated

## 🎯 **Next Steps**

1. **Test both login flows** (Admin & Beneficiary)
2. **Verify dashboard access** after login
3. **Test with different phone numbers**
4. **Confirm no SMS dependencies**

## 📞 **Support**

If you encounter any issues:
1. Check server logs in terminal
2. Verify both servers are running
3. Confirm OTP is `123456`
4. Check browser console for errors

**Everything is now configured for seamless testing with static OTP `123456`!**