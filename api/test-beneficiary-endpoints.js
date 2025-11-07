const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('./src/models');
const authService = require('./src/services/authService');

async function testEndpoints() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const phone = '9876543214';
    const user = await User.findOne({ phone });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📋 User Details:');
    console.log('- ID:', user._id);
    console.log('- Name:', user.name);
    console.log('- Phone:', user.phone);
    console.log('- Role:', user.role);
    console.log('- Is Active:', user.isActive);

    const token = authService.generateToken(user);
    console.log('\n🔑 Token generated');

    // Test the endpoints
    const baseUrl = 'http://localhost:8000/api/beneficiary';
    
    console.log('\n🧪 Testing /stats endpoint...');
    const statsResponse = await fetch(`${baseUrl}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Stats Response Status:', statsResponse.status);
    const statsData = await statsResponse.json();
    console.log('Stats Response:', JSON.stringify(statsData, null, 2));

    console.log('\n🧪 Testing /applications endpoint...');
    const appsResponse = await fetch(`${baseUrl}/applications?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Applications Response Status:', appsResponse.status);
    const appsData = await appsResponse.json();
    console.log('Applications Response:', JSON.stringify(appsData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testEndpoints();
