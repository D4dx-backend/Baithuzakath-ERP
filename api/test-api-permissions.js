#!/usr/bin/env node

/**
 * Test what the API will actually return for user permissions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const rbacService = require('./src/services/rbacService');
const { User, Permission } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

async function testAPIPermissions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the state admin user
    const user = await User.findOne({ phone: '9656550933' });
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('👤 Testing for user:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}\n`);

    // Simulate what the API endpoint does
    console.log('🔍 Simulating API: GET /api/rbac/users/:userId/permissions');
    console.log('='.repeat(60));

    const permissionIds = await rbacService.getUserPermissions(user._id);
    console.log(`\n📊 Total permission IDs returned: ${permissionIds.length}`);

    const permissions = await Permission.find({
      _id: { $in: permissionIds }
    }).sort({ module: 1, category: 1 });

    console.log(`📊 Total permissions resolved: ${permissions.length}\n`);

    // Group by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});

    console.log('📦 Permissions by Module:');
    console.log('='.repeat(60));
    
    Object.keys(groupedPermissions).sort().forEach(module => {
      console.log(`\n${module.toUpperCase()}:`);
      groupedPermissions[module].forEach(p => {
        console.log(`  ✅ ${p.name}`);
      });
    });

    // Check specifically for donor permissions
    console.log('\n\n🎯 Donor-Related Permissions Check:');
    console.log('='.repeat(60));
    
    const donorPerms = permissions.filter(p => 
      p.name.startsWith('donors.') || p.name.startsWith('donations.') || p.name === 'communications.send'
    );

    if (donorPerms.length === 0) {
      console.log('❌ NO DONOR PERMISSIONS FOUND!');
      console.log('   The /donors page will show "Access Denied"\n');
    } else {
      console.log(`✅ Found ${donorPerms.length} donor-related permissions:\n`);
      donorPerms.forEach(p => {
        console.log(`   ✅ ${p.name} - ${p.displayName}`);
      });
    }

    // Test specific permission checks
    console.log('\n\n🧪 Testing Specific Permission Checks:');
    console.log('='.repeat(60));
    
    const testPermissions = [
      'donors.read',
      'donors.read.regional',
      'donors.create',
      'donations.create',
      'communications.send'
    ];

    for (const permName of testPermissions) {
      const hasIt = await rbacService.hasPermission(user._id, permName);
      console.log(`${hasIt ? '✅' : '❌'} ${permName}: ${hasIt ? 'YES' : 'NO'}`);
    }

    // Final verdict
    console.log('\n\n🎉 FINAL VERDICT:');
    console.log('='.repeat(60));
    
    const hasDonorsRead = await rbacService.hasPermission(user._id, 'donors.read');
    
    if (hasDonorsRead) {
      console.log('✅ User CAN access the /donors page!');
      console.log('✅ The "Access Denied" message should be gone.');
      console.log('\n💡 Next steps:');
      console.log('   1. Restart the backend API server (if running)');
      console.log('   2. Clear browser cache and local storage');
      console.log('   3. Log out and log back in');
      console.log('   4. Navigate to /donors page');
    } else {
      console.log('❌ User CANNOT access the /donors page');
      console.log('❌ Something is still wrong with the permissions');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAPIPermissions().then(() => process.exit(0));
