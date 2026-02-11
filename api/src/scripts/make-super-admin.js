const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User } = require('../models');

/**
 * Script to make a user super admin by phone number
 * Usage: node api/src/scripts/make-super-admin.js
 */

const PHONE_NUMBER = '7592046146';

async function makeSuperAdmin() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find user by phone number
    let user = await User.findOne({ phone: PHONE_NUMBER });

    if (user) {
      console.log(`📱 Found existing user with phone: ${PHONE_NUMBER}`);
      console.log(`   Current role: ${user.role}`);
      
      // Update to super admin
      user.role = 'super_admin';
      user.adminScope = {
        level: 'super',
        permissions: {
          canCreateUsers: true,
          canManageProjects: true,
          canManageSchemes: true,
          canApproveApplications: true,
          canViewReports: true,
          canManageFinances: true
        }
      };
      user.isVerified = true;
      user.isActive = true;

      await user.save();
      console.log('✅ User updated to super admin successfully!');
    } else {
      console.log(`📱 User not found. Creating new super admin with phone: ${PHONE_NUMBER}`);
      
      // Create new super admin user
      user = new User({
        name: 'Super Administrator',
        phone: PHONE_NUMBER,
        role: 'super_admin',
        adminScope: {
          level: 'super',
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
        isActive: true
      });

      await user.save();
      console.log('✅ Super admin user created successfully!');
    }

    console.log('\n📋 User Details:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Email: ${user.email || 'Not set'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Admin Level: ${user.adminScope.level}`);
    console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   Verified: ${user.isVerified ? 'Yes' : 'No'}`);
    console.log('\n🔑 Use OTP login with this phone number to access the system');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
makeSuperAdmin()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
