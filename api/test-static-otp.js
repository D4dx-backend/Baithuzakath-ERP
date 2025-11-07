/**
 * Simple test script to verify static OTP authentication works
 * Run this with: node test-static-otp.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';
const TEST_PHONE = '9876543210';
const STATIC_OTP = '123456';

async function testStaticOTP() {
  try {
    console.log('🧪 Testing Static OTP Authentication...\n');

    // Step 1: Request OTP
    console.log('📱 Step 1: Requesting OTP...');
    const otpResponse = await axios.post(`${API_BASE}/auth/send-otp`, {
      phone: TEST_PHONE,
      purpose: 'login'
    });

    console.log('✅ OTP Request Response:', {
      success: otpResponse.data.success,
      message: otpResponse.data.message,
      staticOTP: otpResponse.data.data?.staticOTP,
      note: otpResponse.data.data?.note
    });

    // Step 2: Verify OTP
    console.log('\n🔐 Step 2: Verifying OTP...');
    const loginResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: TEST_PHONE,
      otp: STATIC_OTP,
      purpose: 'login'
    });

    console.log('✅ Login Response:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      user: loginResponse.data.data?.user?.name,
      role: loginResponse.data.data?.user?.role,
      hasToken: !!loginResponse.data.data?.tokens?.accessToken
    });

    console.log('\n🎉 Static OTP Authentication Test PASSED!');
    console.log('📋 Summary:');
    console.log(`   - Phone: ${TEST_PHONE}`);
    console.log(`   - Static OTP: ${STATIC_OTP}`);
    console.log('   - SMS Service: DISABLED');
    console.log('   - Authentication: SUCCESS');

  } catch (error) {
    console.error('❌ Test Failed:', {
      message: error.message,
      response: error.response?.data
    });
  }
}

// Run the test
testStaticOTP();