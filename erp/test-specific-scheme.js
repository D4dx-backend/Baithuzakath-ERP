const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';
const SCHEME_ID = '68f4a65ffbe20844c73fad8e';

async function testSpecificScheme() {
  console.log('🧪 Testing specific scheme:', SCHEME_ID);

  try {
    // First, let's get a token
    console.log('\n1. Getting authentication token...');
    const otpResponse = await axios.post(`${API_BASE_URL}/beneficiary/auth/send-otp`, {
      phone: '9876543210'
    });
    
    if (otpResponse.data.data && otpResponse.data.data.developmentOTP) {
      const verifyResponse = await axios.post(`${API_BASE_URL}/beneficiary/auth/verify-otp`, {
        phone: '9876543210',
        otp: otpResponse.data.data.developmentOTP
      });
      
      const token = verifyResponse.data.data.token;
      console.log('✅ Token obtained');

      // Now test the specific scheme
      console.log('\n2. Testing scheme details endpoint...');
      try {
        const schemeResponse = await axios.get(`${API_BASE_URL}/beneficiary/schemes/${SCHEME_ID}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Scheme details retrieved successfully');
        console.log('📋 Scheme name:', schemeResponse.data.data.scheme.name);
        console.log('📋 Has form config:', !!schemeResponse.data.data.scheme.formConfig);
        console.log('📋 Form pages:', schemeResponse.data.data.scheme.formConfig?.pages?.length || 0);
        
        if (schemeResponse.data.data.scheme.formConfig?.pages) {
          console.log('📋 Page titles:', schemeResponse.data.data.scheme.formConfig.pages.map(p => p.title));
        }
        
        console.log('\n📄 Full response:');
        console.log(JSON.stringify(schemeResponse.data, null, 2));
        
      } catch (schemeError) {
        console.error('❌ Failed to get scheme details:', schemeError.response?.data || schemeError.message);
      }

      // Also test the schemes list to see if this scheme appears
      console.log('\n3. Testing schemes list...');
      try {
        const schemesResponse = await axios.get(`${API_BASE_URL}/beneficiary/schemes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const schemes = schemesResponse.data.data.schemes;
        const targetScheme = schemes.find(s => s._id === SCHEME_ID);
        
        console.log('✅ Schemes list retrieved');
        console.log('📊 Total schemes:', schemes.length);
        console.log('🎯 Target scheme found in list:', !!targetScheme);
        
        if (targetScheme) {
          console.log('📋 Scheme in list:', targetScheme.name);
          console.log('📋 Has form config (list):', targetScheme.hasFormConfiguration);
        }
        
      } catch (listError) {
        console.error('❌ Failed to get schemes list:', listError.response?.data || listError.message);
      }

    } else {
      console.log('❌ No development OTP received');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSpecificScheme();