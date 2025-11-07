const axios = require('axios');

// Use the token we just generated
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTA1NzY3NGZhMjgyNTMzMTE3ZWNlZjYiLCJlbWFpbCI6ImJlbmVmaWNpYXJ5QGV4YW1wbGUuY29tIiwicGhvbmUiOiI5ODc2NTQzMjE0Iiwicm9sZSI6ImJlbmVmaWNpYXJ5IiwiYWRtaW5TY29wZSI6eyJwZXJtaXNzaW9ucyI6eyJjYW5DcmVhdGVVc2VycyI6ZmFsc2UsImNhbk1hbmFnZVByb2plY3RzIjpmYWxzZSwiY2FuTWFuYWdlU2NoZW1lcyI6ZmFsc2UsImNhbkFwcHJvdmVBcHBsaWNhdGlvbnMiOmZhbHNlLCJjYW5WaWV3UmVwb3J0cyI6ZmFsc2UsImNhbk1hbmFnZUZpbmFuY2VzIjpmYWxzZX0sInJlZ2lvbnMiOltdLCJwcm9qZWN0cyI6W10sInNjaGVtZXMiOltdfSwiaWF0IjoxNzYyNDkwNjc0LCJleHAiOjE3NjMwOTU0NzQsImF1ZCI6ImJhaXRodXp6YWthdGgtY2xpZW50IiwiaXNzIjoiYmFpdGh1enpha2F0aC1hcGkifQ.JFPa0wU1PW8tsL3etxKSth0WmjYWPhS2Y-jPEFbF2N4';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');

    // Test 1: Get applications
    console.log('1️⃣ Testing GET /api/beneficiary/applications');
    try {
      const response = await axios.get('http://localhost:8000/api/beneficiary/applications?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Success:', response.status);
      console.log('Data:', response.data);
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n');

    // Test 2: Get stats
    console.log('2️⃣ Testing GET /api/beneficiary/stats');
    try {
      const response = await axios.get('http://localhost:8000/api/beneficiary/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Success:', response.status);
      console.log('Data:', response.data);
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
