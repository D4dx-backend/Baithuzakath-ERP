const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from api/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { User } = require('../models');
const config = require('../config/environment');

async function createTestUser() {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ phone: '9876543210' });
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('Phone: 9876543210');
      console.log('Role:', existingUser.role);
      return;
    }

    // Create test user
    const testUser = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      phone: '9876543210',
      role: 'state_admin',
      adminScope: {
        level: 'state',
        permissions: {
          canCreateUsers: true,
          canManageProjects: true,
          canManageSchemes: true,
          canApproveApplications: true,
          canViewReports: true,
          canManageFinances: true
        }
      },
      isVerified: true,
      isActive: true,
      password: null // OTP-only authentication
    });

    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log('Phone: 9876543210');
    console.log('Role: state_admin');
    console.log('Use OTP: 123456 (in development mode)');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
createTestUser();