#!/usr/bin/env node

/**
 * Fix super_admin role to have ALL permissions including donor permissions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Role, Permission } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

async function fixSuperAdminPermissions() {
  try {
    console.log('🔧 Fixing super_admin permissions...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get super_admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      console.log('❌ super_admin role not found!');
      return;
    }

    console.log('📋 Current super_admin role:');
    console.log(`   Name: ${superAdminRole.displayName}`);
    console.log(`   Current permissions: ${superAdminRole.permissions.length}\n`);

    // Get ALL active permissions
    const allPermissions = await Permission.find({ isActive: true });
    console.log(`📊 Total active permissions in system: ${allPermissions.length}\n`);

    // List all permission modules
    const modules = {};
    allPermissions.forEach(p => {
      if (!modules[p.module]) modules[p.module] = 0;
      modules[p.module]++;
    });

    console.log('📦 Permissions by module:');
    Object.keys(modules).sort().forEach(module => {
      console.log(`   ${module}: ${modules[module]}`);
    });

    // Update super_admin with ALL permissions
    superAdminRole.permissions = allPermissions.map(p => p._id);
    await superAdminRole.save();

    console.log(`\n✅ Updated super_admin role with ${allPermissions.length} permissions\n`);

    // Verify donor permissions are included
    const donorPerms = allPermissions.filter(p => 
      p.module === 'donors' || p.module === 'donations' || p.module === 'communications'
    );

    console.log('🎯 Donor-related permissions included:');
    donorPerms.forEach(p => {
      console.log(`   ✅ ${p.name}`);
    });

    console.log(`\n📊 Total donor permissions: ${donorPerms.length}`);
    console.log('\n✨ Super admin permissions fixed!');
    console.log('\n💡 Next steps:');
    console.log('   1. User must LOG OUT completely');
    console.log('   2. Clear browser cache and local storage');
    console.log('   3. Log back in with phone: 9999999999');
    console.log('   4. Permissions will be refreshed on login\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixSuperAdminPermissions().then(() => process.exit(0));
