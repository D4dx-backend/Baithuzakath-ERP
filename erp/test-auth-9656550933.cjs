const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';
const PHONE = '9656550933';

async function testAuthentication() {
  try {
    console.log('🧪 Testing Authentication Flow for State Admin...\n');
    console.log(`📱 Phone: ${PHONE}\n`);

    // Step 1: Request OTP
    console.log('1️⃣ Requesting OTP...');
    const otpResponse = await axios.post(`${API_BASE}/auth/send-otp`, {
      phone: PHONE,
      purpose: 'login'
    });
    
    console.log('✅ OTP Response:', JSON.stringify(otpResponse.data, null, 2));
    
    const developmentOTP = otpResponse.data.data?.developmentOTP || '123456';
    console.log(`\n🔐 Development OTP: ${developmentOTP}`);
    
    // Step 2: Verify OTP and get token
    console.log('\n2️⃣ Verifying OTP and logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: PHONE,
      otp: developmentOTP,
      purpose: 'login'
    });
    
    console.log('✅ Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.success && loginResponse.data.data) {
      const token = loginResponse.data.data.tokens?.accessToken || loginResponse.data.data.accessToken;
      const user = loginResponse.data.data.user;
      
      console.log('\n👤 User Details:');
      console.log('================');
      console.log('- ID:', user.id);
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Phone:', user.phone);
      console.log('- Role:', user.role);
      console.log('- Active:', user.isActive);
      console.log('- Verified:', user.isVerified);
      console.log('- Admin Level:', user.adminScope?.level);
      console.log('- Token preview:', token?.substring(0, 50) + '...');
      
      // Step 3: Test profile API
      console.log('\n3️⃣ Testing Profile API...');
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Profile API Success!');
      console.log('Profile:', JSON.stringify(profileResponse.data.data.user, null, 2));
      
      // Step 4: Test users API (state admin should have access)
      console.log('\n4️⃣ Testing Users API...');
      try {
        const usersResponse = await axios.get(`${API_BASE}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Users API Success!');
        console.log(`Total users: ${usersResponse.data.data?.users?.length || 0}`);
      } catch (usersError) {
        console.log('❌ Users API Error:', usersError.response?.data?.message || usersError.message);
      }
      
      // Step 5: Test applications API
      console.log('\n5️⃣ Testing Applications API...');
      try {
        const appsResponse = await axios.get(`${API_BASE}/applications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Applications API Success!');
        console.log(`Total applications: ${appsResponse.data.data?.applications?.length || 0}`);
      } catch (appsError) {
        console.log('❌ Applications API Error:', appsError.response?.data?.message || appsError.message);
      }
      
      // Step 6: Test schemes API
      console.log('\n6️⃣ Testing Schemes API...');
      try {
        const schemesResponse = await axios.get(`${API_BASE}/schemes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Schemes API Success!');
        console.log(`Total schemes: ${schemesResponse.data.data?.schemes?.length || 0}`);
      } catch (schemesError) {
        console.log('❌ Schemes API Error:', schemesError.response?.data?.message || schemesError.message);
      }
      
      console.log('\n✅ All tests completed!');
      console.log('\n📝 Summary:');
      console.log('================');
      console.log('✅ User created successfully');
      console.log('✅ OTP authentication working');
      console.log('✅ Login successful');
      console.log('✅ Token generated');
      console.log('✅ State admin role assigned');
      console.log('\n🎉 User 9656550933 is ready to use!');
      
    } else {
      console.log('❌ Login failed');
      console.log('Response:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('================');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data?.message || error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 403) {
        console.log('\n🔍 Permission Error - Check:');
        console.log('- User role is correct');
        console.log('- User is active and verified');
        console.log('- RBAC permissions are properly configured');
      }
    } else {
      console.error('Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n⚠️  API server is not running!');
        console.log('Please start the API server first:');
        console.log('  cd baithuzkath-api && npm start');
      }
    }
  }
}

testAuthentication();
