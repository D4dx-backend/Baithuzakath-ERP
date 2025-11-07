const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-decode-token.js <token>');
  process.exit(1);
}

try {
  const decoded = jwt.decode(token, { complete: true });
  console.log('\n📋 Token Header:');
  console.log(JSON.stringify(decoded.header, null, 2));
  
  console.log('\n📋 Token Payload:');
  console.log(JSON.stringify(decoded.payload, null, 2));
  
  // Try to verify
  const verified = jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'baithuzzakath-api',
    audience: 'baithuzzakath-client'
  });
  
  console.log('\n✅ Token is valid');
  console.log('\n📋 Verified Payload:');
  console.log(JSON.stringify(verified, null, 2));
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
}
