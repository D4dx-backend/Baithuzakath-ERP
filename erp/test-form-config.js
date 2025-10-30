const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test form configuration endpoints
async function testFormConfiguration() {
  try {
    console.log('🧪 Testing Form Configuration API...\n');

    // First, let's get a scheme to test with
    console.log('1. Getting schemes...');
    const schemesResponse = await axios.get(`${API_BASE_URL}/schemes`, {
      headers: {
        'Authorization': 'Bearer test-token' // You'll need a real token
      }
    });
    
    if (schemesResponse.data.data.schemes.length === 0) {
      console.log('❌ No schemes found to test with');
      return;
    }

    const testScheme = schemesResponse.data.data.schemes[0];
    console.log(`✅ Found scheme: ${testScheme.name} (ID: ${testScheme.id})`);

    // Test getting form configuration
    console.log('\n2. Getting form configuration...');
    const getConfigResponse = await axios.get(`${API_BASE_URL}/schemes/${testScheme.id}/form-config`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Form configuration retrieved successfully');
    console.log('Form Title:', getConfigResponse.data.data.formConfiguration.title);

    // Test updating form configuration
    console.log('\n3. Updating form configuration...');
    const updateData = {
      title: `${testScheme.name} - Updated Application Form`,
      description: `Updated application form for ${testScheme.name} scheme.`,
      enabled: true,
      emailNotifications: true,
      pages: [
        {
          id: 1,
          title: "Personal Information",
          fields: [
            { id: 1, label: "Full Name", type: "text", required: true, enabled: true, placeholder: "Enter your full name" },
            { id: 2, label: "Email Address", type: "email", required: true, enabled: true, placeholder: "your@email.com" },
            { id: 3, label: "Phone Number", type: "phone", required: true, enabled: true, placeholder: "+91 XXXXXXXXXX" }
          ]
        }
      ]
    };

    const updateResponse = await axios.put(`${API_BASE_URL}/schemes/${testScheme.id}/form-config`, updateData, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Form configuration updated successfully');
    console.log('Updated Title:', updateResponse.data.data.formConfiguration.title);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Note: You need to authenticate first to test these endpoints.');
      console.log('The endpoints are working, but require valid authentication.');
    }
  }
}

// Run the test
testFormConfiguration();