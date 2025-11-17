# 📋 API Testing Guide

## Swagger UI (Recommended)

**URL:** http://localhost:4000/api-docs

The Swagger UI provides:
- Interactive API documentation
- Try-it-out functionality for all endpoints
- Request/response examples
- Schema definitions
- Authentication testing

### How to Use Swagger UI:

1. **Start the API server:**
   ```bash
   cd api
   npm start
   ```

2. **Open Swagger UI:**
   Navigate to http://localhost:4000/api-docs in your browser

3. **Test Authentication:**
   - Expand "Authentication" section
   - Click "POST /api/beneficiary/auth/send-otp"
   - Click "Try it out"
   - Enter phone number: `9876543210`
   - Click "Execute"
   - Copy the OTP from response (in dev mode: `123456`)
   - Test verify-otp endpoint with phone and OTP
   - Copy the JWT token from response

4. **Authorize for Protected Endpoints:**
   - Click "Authorize" button at top
   - Enter: `Bearer <your-token>`
   - Click "Authorize"
   - Now all protected endpoints will include the token

5. **Test Protected Endpoints:**
   - All endpoints under Profile, Schemes, Applications, Tracking sections
   - They will automatically use the authorized token

---

## Postman Setup

### Option 1: Import from Swagger

1. Visit http://localhost:4000/api-docs
2. Copy the URL
3. Open Postman
4. File → Import → Link
5. Paste the Swagger URL
6. Import as collection

### Option 2: Manual Collection Setup

Create a new collection with these variables:

**Collection Variables:**
```
base_url: http://localhost:4000
token: (will be set after login)
phone: 9876543210
```

**Add these requests:**

#### 1. Send OTP
```
POST {{base_url}}/api/beneficiary/auth/send-otp
Content-Type: application/json

{
  "phone": "{{phone}}"
}

Test Script:
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});
```

#### 2. Verify OTP
```
POST {{base_url}}/api/beneficiary/auth/verify-otp
Content-Type: application/json

{
  "phone": "{{phone}}",
  "otp": "123456"
}

Test Script:
const response = pm.response.json();
if (response.success && response.data.token) {
    pm.collectionVariables.set("token", response.data.token);
    console.log("Token saved:", response.data.token);
}
```

#### 3. Get Profile
```
GET {{base_url}}/api/beneficiary/auth/profile
Authorization: Bearer {{token}}
```

#### 4. Get Schemes
```
GET {{base_url}}/api/beneficiary/schemes
Authorization: Bearer {{token}}
```

#### 5. Get Scheme Details
```
GET {{base_url}}/api/beneficiary/schemes/:schemeId
Authorization: Bearer {{token}}
```

#### 6. Submit Application
```
POST {{base_url}}/api/beneficiary/applications
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "schemeId": "{{schemeId}}",
  "formData": {
    "field_1": "Test User",
    "field_2": "1990-01-15",
    "field_3": "male",
    "field_12": 50000
  }
}
```

#### 7. Get My Applications
```
GET {{base_url}}/api/beneficiary/applications
Authorization: Bearer {{token}}
```

#### 8. Track Application
```
GET {{base_url}}/api/beneficiary/track/:applicationId
Authorization: Bearer {{token}}
```

---

## cURL Examples

### 1. Send OTP
```bash
curl -X POST http://localhost:4000/api/beneficiary/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

### 2. Verify OTP
```bash
curl -X POST http://localhost:4000/api/beneficiary/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}'
```

### 3. Get Schemes (with token)
```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:4000/api/beneficiary/schemes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Submit Application
```bash
TOKEN="your-jwt-token-here"
SCHEME_ID="507f1f77bcf86cd799439011"

curl -X POST http://localhost:4000/api/beneficiary/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schemeId": "'$SCHEME_ID'",
    "formData": {
      "field_1": "Test User",
      "field_2": "1990-01-15",
      "field_3": "male",
      "field_12": 50000
    }
  }'
```

---

## JavaScript/Fetch Examples

### Complete Flow

```javascript
const BASE_URL = 'http://localhost:4000';
let authToken = null;

// 1. Send OTP
async function sendOTP(phone) {
  const response = await fetch(`${BASE_URL}/api/beneficiary/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  const data = await response.json();
  console.log('OTP sent:', data);
  return data;
}

// 2. Verify OTP
async function verifyOTP(phone, otp) {
  const response = await fetch(`${BASE_URL}/api/beneficiary/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  const data = await response.json();
  
  if (data.success) {
    authToken = data.data.token;
    console.log('Logged in, token:', authToken);
  }
  
  return data;
}

// 3. Get Schemes
async function getSchemes() {
  const response = await fetch(`${BASE_URL}/api/beneficiary/schemes`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

// 4. Submit Application
async function submitApplication(schemeId, formData) {
  const response = await fetch(`${BASE_URL}/api/beneficiary/applications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ schemeId, formData })
  });
  return response.json();
}

// Usage
async function testFlow() {
  // Step 1: Send OTP
  await sendOTP('9876543210');
  
  // Step 2: Verify OTP (in dev mode, OTP is always 123456)
  await verifyOTP('9876543210', '123456');
  
  // Step 3: Get schemes
  const schemes = await getSchemes();
  console.log('Schemes:', schemes);
  
  // Step 4: Submit application
  if (schemes.data.schemes.length > 0) {
    const schemeId = schemes.data.schemes[0]._id;
    const application = await submitApplication(schemeId, {
      field_1: 'Test User',
      field_2: '1990-01-15',
      field_3: 'male',
      field_12: 50000
    });
    console.log('Application:', application);
  }
}

// Run test
testFlow().catch(console.error);
```

---

## Python/Requests Examples

```python
import requests

BASE_URL = 'http://localhost:4000'
session = requests.Session()

# 1. Send OTP
def send_otp(phone):
    response = session.post(
        f'{BASE_URL}/api/beneficiary/auth/send-otp',
        json={'phone': phone}
    )
    return response.json()

# 2. Verify OTP
def verify_otp(phone, otp):
    response = session.post(
        f'{BASE_URL}/api/beneficiary/auth/verify-otp',
        json={'phone': phone, 'otp': otp}
    )
    data = response.json()
    
    if data['success']:
        token = data['data']['token']
        session.headers.update({'Authorization': f'Bearer {token}'})
    
    return data

# 3. Get Schemes
def get_schemes():
    response = session.get(f'{BASE_URL}/api/beneficiary/schemes')
    return response.json()

# 4. Submit Application
def submit_application(scheme_id, form_data):
    response = session.post(
        f'{BASE_URL}/api/beneficiary/applications',
        json={'schemeId': scheme_id, 'formData': form_data}
    )
    return response.json()

# Usage
if __name__ == '__main__':
    # Login
    send_otp('9876543210')
    verify_otp('9876543210', '123456')
    
    # Get schemes
    schemes = get_schemes()
    print('Schemes:', schemes)
    
    # Submit application
    if schemes['data']['schemes']:
        scheme_id = schemes['data']['schemes'][0]['_id']
        app = submit_application(scheme_id, {
            'field_1': 'Test User',
            'field_2': '1990-01-15',
            'field_3': 'male',
            'field_12': 50000
        })
        print('Application:', app)
```

---

## Testing Checklist

### Authentication Tests
- [ ] Send OTP to valid phone number
- [ ] Send OTP to invalid phone number
- [ ] Verify correct OTP
- [ ] Verify incorrect OTP
- [ ] Verify expired OTP
- [ ] Resend OTP with rate limiting

### Profile Tests
- [ ] Get profile (first time - incomplete)
- [ ] Update profile with all fields
- [ ] Get profile (after update - complete)
- [ ] Update profile with invalid data

### Scheme Tests
- [ ] List all schemes
- [ ] Filter schemes by category
- [ ] Search schemes
- [ ] Get scheme details
- [ ] Get form configuration

### Application Tests
- [ ] Submit application with valid data
- [ ] Submit application with missing fields
- [ ] Submit duplicate application
- [ ] Get my applications
- [ ] Filter applications by status
- [ ] Get application details
- [ ] Track application
- [ ] Cancel pending application
- [ ] Get application statistics

### Error Handling Tests
- [ ] Request without authentication token
- [ ] Request with invalid token
- [ ] Request with expired token
- [ ] Invalid IDs
- [ ] Malformed requests

---

## Expected Responses

### Success Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Server Error

---

## Troubleshooting

### Issue: "Cannot connect to server"
**Solution:** Ensure API server is running on port 4000

### Issue: "Unauthorized" error
**Solution:** Check token is included in Authorization header

### Issue: "Token expired"
**Solution:** Login again to get new token

### Issue: "Already applied for this scheme"
**Solution:** Check scheme details, user may have existing application

---

## Quick Test Script

Save as `test-api.js` and run with `node test-api.js`:

```javascript
const BASE_URL = 'http://localhost:4000';

async function quickTest() {
  console.log('🧪 Starting API tests...\n');
  
  // Test 1: Health check
  console.log('1️⃣  Testing health endpoint...');
  const health = await fetch(`${BASE_URL}/health`);
  console.log('✅ Health:', await health.json(), '\n');
  
  // Test 2: Send OTP
  console.log('2️⃣  Sending OTP...');
  const otpRes = await fetch(`${BASE_URL}/api/beneficiary/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210' })
  });
  const otpData = await otpRes.json();
  console.log('✅ OTP sent:', otpData.message);
  console.log('   OTP:', otpData.data.staticOTP || '123456', '\n');
  
  // Test 3: Verify OTP
  console.log('3️⃣  Verifying OTP...');
  const loginRes = await fetch(`${BASE_URL}/api/beneficiary/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  console.log('✅ Logged in:', loginData.data.user.name);
  console.log('   Token:', token.substring(0, 30) + '...', '\n');
  
  // Test 4: Get schemes
  console.log('4️⃣  Getting schemes...');
  const schemesRes = await fetch(`${BASE_URL}/api/beneficiary/schemes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const schemesData = await schemesRes.json();
  console.log('✅ Found', schemesData.data.schemes.length, 'schemes');
  if (schemesData.data.schemes.length > 0) {
    console.log('   First scheme:', schemesData.data.schemes[0].name, '\n');
  }
  
  console.log('🎉 All tests passed!');
}

quickTest().catch(console.error);
```

---

For more details, see:
- [BENEFICIARY_MOBILE_API_GUIDE.md](./BENEFICIARY_MOBILE_API_GUIDE.md)
- [MOBILE_TEAM_QUICK_START.md](./MOBILE_TEAM_QUICK_START.md)
- Swagger UI: http://localhost:4000/api-docs
