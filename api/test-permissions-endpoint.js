const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('./src/config/environment');

// You can pass a token as command line argument
const token = process.argv[2];

if (!token) {
  console.log('❌ Please provide a token as argument');
  console.log('Usage: node test-permissions-endpoint.js <your-token>');
  console.log('\nYou can get your token from browser localStorage');
  process.exit(1);
}

async function testPermissionsEndpoint() {
  try {
    console.log('🔍 Testing /api/rbac/permissions endpoint...\n');

    // Decode token to see what's in it
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      console.log('✅ Token is valid');
      console.log('📋 Token contents:');
      console.log(`   User ID: ${decoded.userId}`);
      console.log(`   Role: ${decoded.role}`);
      console.log(`   Issued: ${new Date(decoded.iat * 1000).toLocaleString()}`);
      console.log(`   Expires: ${new Date(decoded.exp * 1000).toLocaleString()}\n`);
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      process.exit(1);
    }

    // Test the endpoint
    console.log('🌐 Making request to http://localhost:8000/api/rbac/permissions...\n');

    const response = await axios.get('http://localhost:8000/api/rbac/permissions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Request successful!');
    console.log(`📦 Received ${response.data.data.permissions.length} permissions\n`);
    
    // Show first 5 permissions
    console.log('First 5 permissions:');
    response.data.data.permissions.slice(0, 5).forEach(p => {
      console.log(`  - ${p.name} (${p.displayName})`);
    });

  } catch (error) {
    console.error('\n❌ Request failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data.message || error.response.statusText}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testPermissionsEndpoint();
