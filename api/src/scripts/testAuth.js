const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testAuthFlow() {
  try {
    console.log('🧪 Testing Authentication Flow...\n');

    // Step 1: Request OTP
    console.log('1. Requesting OTP for phone: 9876543210');
    const otpResponse = await axios.post(`${API_BASE}/auth/send-otp`, {
      phone: '9876543210',
      purpose: 'login'
    });

    console.log('✅ OTP Response:', otpResponse.data);
    const developmentOTP = otpResponse.data.data?.developmentOTP || '123456';
    console.log('🔑 Using OTP:', developmentOTP);

    // Step 2: Verify OTP
    console.log('\n2. Verifying OTP...');
    const verifyResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: '9876543210',
      otp: developmentOTP,
      purpose: 'login'
    });

    console.log('✅ Verify Response:', JSON.stringify(verifyResponse.data, null, 2));
    
    if (verifyResponse.data.success && verifyResponse.data.data.tokens) {
      const token = verifyResponse.data.data.tokens.accessToken;
      console.log('🎫 Token received:', token.substring(0, 20) + '...');

      // Step 3: Test authenticated request
      console.log('\n3. Testing authenticated request to /api/projects...');
      const projectsResponse = await axios.get(`${API_BASE}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Projects Response Status:', projectsResponse.status);
      console.log('✅ Projects Data:', projectsResponse.data);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

// Run the test
testAuthFlow();