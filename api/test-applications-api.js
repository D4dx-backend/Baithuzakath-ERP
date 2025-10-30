const mongoose = require('mongoose');
const Application = require('./src/models/Application');
require('dotenv').config();

async function testApplicationsAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath');
    console.log('✅ Connected to MongoDB');

    // Check total applications in database
    const totalApplications = await Application.countDocuments();
    console.log('📊 Total applications in database:', totalApplications);

    if (totalApplications > 0) {
      // Get first few applications
      const applications = await Application.find()
        .populate('beneficiary', 'name phone')
        .populate('scheme', 'name code')
        .populate('project', 'name code')
        .populate('state', 'name code')
        .populate('district', 'name code')
        .populate('area', 'name code')
        .populate('unit', 'name code')
        .limit(3);

      console.log('\n📋 Sample Applications:');
      applications.forEach((app, index) => {
        console.log(`${index + 1}. Application ${app.applicationNumber}`);
        console.log(`   - Beneficiary: ${app.beneficiary?.name || 'N/A'}`);
        console.log(`   - Scheme: ${app.scheme?.name || 'N/A'}`);
        console.log(`   - Status: ${app.status}`);
        console.log(`   - Amount: ₹${app.requestedAmount}`);
        console.log(`   - State: ${app.state?.name || 'N/A'}`);
        console.log(`   - District: ${app.district?.name || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No applications found in database');
    }

    // Test API call simulation
    console.log('\n🧪 Testing API Response Format:');
    const mockResponse = {
      success: true,
      data: {
        applications: [],
        pagination: {
          current: 1,
          pages: 0,
          total: 0,
          limit: 10
        }
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Expected API Response Format:', JSON.stringify(mockResponse, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testApplicationsAPI();