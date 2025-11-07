const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('./src/models');
const authService = require('./src/services/authService');

async function testAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const phone = '9876543214';
    const user = await User.findOne({ phone });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📋 User from DB:');
    console.log('- ID:', user._id.toString());
    console.log('- Role:', user.role);
    console.log('- Is Active:', user.isActive);

    const token = authService.generateToken(user);
    console.log('\n🔑 Generated Token (first 50 chars):', token.substring(0, 50) + '...');

    // Verify the token
    const decoded = authService.verifyToken(token);
    console.log('\n📋 Decoded Token:');
    console.log('- userId:', decoded.userId);
    console.log('- role:', decoded.role);
    console.log('- phone:', decoded.phone);

    // Fetch user again using decoded userId
    const userFromToken = await User.findById(decoded.userId);
    console.log('\n📋 User fetched using token userId:');
    console.log('- ID:', userFromToken._id.toString());
    console.log('- Role:', userFromToken.role);
    console.log('- Is Active:', userFromToken.isActive);

    // Test the API endpoint
    console.log('\n🧪 Testing API endpoint...');
    const response = await fetch('http://localhost:8000/api/beneficiary/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response Status:', response.status);
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAPI();
