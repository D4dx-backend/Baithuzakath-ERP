const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testBeneficiaryAPI() {
  console.log('🧪 Testing Beneficiary API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('✅ Health check:', healthResponse.data.message);

    // Test 2: Send OTP
    console.log('\n2. Testing OTP send...');
    const otpResponse = await axios.post(`${API_BASE_URL}/beneficiary/auth/send-otp`, {
      phone: '9876543210'
    });
    console.log('✅ OTP sent:', otpResponse.data.message);
    console.log('📱 Response data:', JSON.stringify(otpResponse.data, null, 2));
    
    if (otpResponse.data.data && otpResponse.data.data.developmentOTP) {
      console.log('🔑 Development OTP:', otpResponse.data.data.developmentOTP);
      
      // Test 3: Verify OTP
      console.log('\n3. Testing OTP verification...');
      const verifyResponse = await axios.post(`${API_BASE_URL}/beneficiary/auth/verify-otp`, {
        phone: '9876543210',
        otp: otpResponse.data.data.developmentOTP
      });
      console.log('✅ OTP verified:', verifyResponse.data.message);
      console.log('🎫 Verify response:', JSON.stringify(verifyResponse.data, null, 2));
      
      const token = verifyResponse.data.data.token;
      if (token) {
        console.log('🎫 Token received:', token.substring(0, 20) + '...');

        // Test 4: Get schemes (protected route)
        console.log('\n4. Testing schemes endpoint...');
        const schemesResponse = await axios.get(`${API_BASE_URL}/beneficiary/schemes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Schemes retrieved:', schemesResponse.data.data.schemes.length, 'schemes found');

        // Test 5: Get profile
        console.log('\n5. Testing profile endpoint...');
        const profileResponse = await axios.get(`${API_BASE_URL}/beneficiary/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Profile retrieved:', profileResponse.data.data.user.name);
      } else {
        console.log('❌ No token received in verify response');
      }
    } else {
      console.log('❌ No development OTP in response');
    }

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.response?.status) {
      console.error('Status code:', error.response.status);
    }
  }
}

// Run tests
testBeneficiaryAPI();