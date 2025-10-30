#!/usr/bin/env node

/**
 * Test script to verify donor permissions for super admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Role, Permission } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

async function testDonorPermissions() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find state admin user (since no super admin exists)
    const stateAdmin = await User.findOne({ phone: '9656550933' });
    if (!stateAdmin) {
      console.log('❌ State admin user not found!');
      return;
    }

    console.log('👤 State Admin User:');
    console.log(`   Name: ${stateAdmin.name}`);
    console.log(`   Email: ${stateAdmin.email}`);
    console.log(`   Phone: ${stateAdmin.phone}`);
    console.log(`   Role: ${stateAdmin.role}\n`);

    // Find state admin role
    const stateAdminRole = await Role.findOne({ name: 'state_admin' }).populate('permissions');
    if (!stateAdminRole) {
      console.log('❌ State admin role not found!');
      return;
    }

    console.log('🔐 State Admin Role:');
    console.log(`   Total Permissions: ${stateAdminRole.permissions.length}\n`);

    // Check for donor permissions
    const donorPermissions = stateAdminRole.permissions.filter(p => 
      p.module === 'donors' || p.module === 'donations' || p.module === 'communications'
    );

    console.log('📋 Donor-Related Permissions:');
    console.log('============================');
    
    if (donorPermissions.length === 0) {
      console.log('❌ No donor permissions found!');
    } else {
      donorPermissions.forEach(p => {
        console.log(`✅ ${p.name} - ${p.displayName}`);
      });
    }

    console.log(`\n📊 Total Donor Permissions: ${donorPermissions.length}`);

    // List all permission modules
    console.log('\n📦 All Permission Modules:');
    console.log('=========================');
    const modules = {};
    stateAdminRole.permissions.forEach(p => {
      if (!modules[p.module]) {
        modules[p.module] = 0;
      }
      modules[p.module]++;
    });

    Object.keys(modules).sort().forEach(module => {
      console.log(`   ${module}: ${modules[module]} permissions`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDonorPermissions()
  .then(() => {
    console.log('\n✨ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });
