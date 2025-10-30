const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testAuthentication() {
  try {
    console.log('🧪 Testing Authentication Flow...\n');

    // Step 1: Request OTP
    console.log('1️⃣ Requesting OTP for 9876543210...');
    const otpResponse = await axios.post(`${API_BASE}/auth/send-otp`, {
      phone: '9876543210',
      purpose: 'login'
    });
    
    console.log('OTP Response:', otpResponse.data);
    
    // Step 2: Verify OTP and get token
    console.log('\n2️⃣ Verifying OTP...');
    const loginResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: '9876543210',
      otp: '123456', // Development OTP
      purpose: 'login'
    });
    
    console.log('Login Response:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.data) {
      const token = loginResponse.data.data.tokens?.accessToken || loginResponse.data.data.accessToken;
      const user = loginResponse.data.data.user;
      
      console.log('\n👤 User Details:');
      console.log('- Name:', user.name);
      console.log('- Role:', user.role);
      console.log('- Active:', user.isActive);
      console.log('- Token preview:', token?.substring(0, 30) + '...');
      
      // Step 3: Test applications API with token
      console.log('\n3️⃣ Testing Applications API...');
      const appsResponse = await axios.get(`${API_BASE}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Applications API Success!');
      console.log('Response:', appsResponse.data);
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('\n🔍 Permission Error Details:');
      console.log('- Status:', error.response.status);
      console.log('- Message:', error.response.data?.message);
      console.log('- This suggests the user role or permissions are still not correct');
    }
  }
}

testAuthentication();