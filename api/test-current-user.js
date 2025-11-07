const jwt = require('jsonwebtoken');
const config = require('./src/config/environment');

// Get token from command line argument or use a default test token
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-current-user.js <token>');
  console.log('\nOr check your browser localStorage for the "token" key');
  process.exit(1);
}

try {
  const decoded = jwt.verify(token, config.jwt.secret);
  console.log('\n✅ Token is valid!');
  console.log('\nDecoded Token:');
  console.log(JSON.stringify(decoded, null, 2));
  console.log('\nUser ID:', decoded.userId);
  console.log('Role:', decoded.role);
  console.log('Issued At:', new Date(decoded.iat * 1000).toLocaleString());
  console.log('Expires At:', new Date(decoded.exp * 1000).toLocaleString());
} catch (error) {
  console.error('\n❌ Token verification failed:', error.message);
}
