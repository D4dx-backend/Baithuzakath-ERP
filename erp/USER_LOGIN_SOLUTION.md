# User Login Issue - Resolution Guide

## Problem Summary
User with phone **9656550933** was showing login failures despite being in the database.

## Root Cause Analysis

### Issue 1: Database Mismatch
- The API server uses **MongoDB Atlas** (cloud database)
- Local scripts were checking **local MongoDB** instance
- This caused confusion about which users actually exist

### Issue 2: Wrong User Role
- Phone **9656550933** exists in cloud database as **Beneficiary**, not State Admin
- Beneficiaries have limited permissions and cannot access admin features

## Current Database State (Cloud - Production)

### All Users:
```
✅ 9999999999 - Super Administrator (super_admin) - ACTIVE
✅ 9876543212 - Area Administrator TVM City (area_admin) - ACTIVE
✅ 9876543211 - District Administrator TVM (district_admin) - ACTIVE
✅ 9876543213 - Unit Administrator Pettah (unit_admin) - ACTIVE
✅ 9876543214 - Sample Beneficiary (beneficiary) - ACTIVE
✅ 9656550933 - Beneficiary 0933 (beneficiary) - ACTIVE
```

## Solution Options

### Option 1: Use Existing Super Admin (RECOMMENDED)
**Phone: 9999999999**
- Role: Super Administrator
- Status: Active and Verified
- Has full system access

**Login Steps:**
```bash
# 1. Send OTP
curl -X POST http://localhost:5001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","purpose":"login"}'

# 2. Verify OTP (use OTP from step 1, in development it's 123456)
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","otp":"123456","purpose":"login"}'
```

### Option 2: Upgrade 9656550933 to State Admin
If you specifically need phone 9656550933 to be a state admin, run this script:

```javascript
// upgrade-user-to-state-admin.js
const mongoose = require('mongoose');
require('dotenv').config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function upgradeUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ phone: '9656550933' });
  
  if (user) {
    user.role = 'state_admin';
    user.adminScope = {
      level: 'state',
      regions: [],
      projects: [],
      schemes: [],
      permissions: {
        canCreateUsers: true,
        canManageProjects: true,
        canManageSchemes: true,
        canApproveApplications: true,
        canViewReports: true,
        canManageFinances: true
      }
    };
    await user.save();
    console.log('✅ User upgraded to state_admin');
  }
  
  await mongoose.connection.close();
}

upgradeUser();
```

### Option 3: Create New State Admin with Different Phone
Create a new state admin user with a different phone number.

## Testing Login Flow

### Step 1: Start API Server
```bash
cd baithuzkath-api
npm start
```

### Step 2: Test with Super Admin (9999999999)
```bash
# Send OTP
curl -X POST http://localhost:5001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","purpose":"login"}'

# Verify OTP
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","otp":"123456","purpose":"login"}'
```

### Step 3: Use Token for API Calls
```bash
# Get token from step 2 response
TOKEN="your-access-token-here"

# Test authenticated endpoint
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## Frontend Login

In your React app, use:
```typescript
// Login with phone 9999999999
const phone = '9999999999';

// 1. Send OTP
await apiClient.post('/auth/send-otp', { phone, purpose: 'login' });

// 2. User enters OTP
const otp = '123456'; // from SMS or development mode

// 3. Verify and login
const response = await apiClient.post('/auth/verify-otp', { 
  phone, 
  otp, 
  purpose: 'login' 
});

// 4. Store token
const { accessToken, user } = response.data.data;
localStorage.setItem('token', accessToken);
localStorage.setItem('user', JSON.stringify(user));
```

## Important Notes

1. **Development Mode**: In development, OTP is always `123456`
2. **Database**: API uses MongoDB Atlas cloud database
3. **Super Admin**: Phone 9999999999 has full system access
4. **RBAC**: All admin features require proper role and permissions

## Verification Scripts

Created helper scripts in `baithuzkath-api/`:
- `check-cloud-users.js` - Check all users in cloud database
- `check-user-9999999999.js` - Check super admin user
- `check-user-9656550933.js` - Check specific user

Run with:
```bash
cd baithuzkath-api
node check-cloud-users.js
```

## Next Steps

1. ✅ Use phone **9999999999** (Super Admin) for testing
2. ✅ Verify API server is running on port 5001
3. ✅ Test OTP flow with curl or Postman
4. ✅ Test frontend login with super admin credentials
5. ⚠️  If you need 9656550933 as state admin, run upgrade script

## Support

If issues persist:
1. Check API server logs
2. Verify MongoDB connection
3. Check RBAC permissions
4. Review authentication middleware
