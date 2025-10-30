#!/usr/bin/env node

/**
 * Verify Admin Permissions Script
 * 
 * This script verifies that Super Admin and State Admin have the correct permissions
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Role, Permission, User, UserRole } = require('./src/models');

async function verifyAdminPermissions() {
  try {
    console.log('🔍 Verifying Admin Permissions...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath');
    console.log('✅ Connected to MongoDB');

    // Get all permissions
    const allPermissions = await Permission.find({ isActive: true });
    console.log(`📋 Total Permissions: ${allPermissions.length}`);

    // Check Super Admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' }).populate('permissions');
    if (superAdminRole) {
      console.log(`\n🔐 Super Administrator:`);
      console.log(`   • Role ID: ${superAdminRole._id}`);
      console.log(`   • Permissions: ${superAdminRole.permissions.length}/${allPermissions.length}`);
      console.log(`   • Has ALL permissions: ${superAdminRole.permissions.length === allPermissions.length ? '✅ YES' : '❌ NO'}`);
      
      // Check for specific critical permissions
      const criticalPermissions = [
        'users.create', 'users.delete', 'roles.create', 'roles.delete',
        'permissions.manage', 'settings.update', 'system.debug', 'forms.manage'
      ];
      
      console.log(`\n   Critical Permissions Check:`);
      for (const permName of criticalPermissions) {
        const hasPermission = superAdminRole.permissions.some(p => p.name === permName);
        console.log(`   • ${permName}: ${hasPermission ? '✅' : '❌'}`);
      }
    }

    // Check State Admin role
    const stateAdminRole = await Role.findOne({ name: 'state_admin' }).populate('permissions');
    if (stateAdminRole) {
      console.log(`\n🏛️  State Administrator:`);
      console.log(`   • Role ID: ${stateAdminRole._id}`);
      console.log(`   • Permissions: ${stateAdminRole.permissions.length}/${allPermissions.length}`);
      
      // Check for specific administrative permissions
      const adminPermissions = [
        'users.create', 'users.read.all', 'beneficiaries.create',
        'applications.approve', 'projects.manage', 'schemes.manage',
        'finances.manage', 'forms.manage', 'locations.create'
      ];
      
      console.log(`\n   Administrative Permissions Check:`);
      for (const permName of adminPermissions) {
        const hasPermission = stateAdminRole.permissions.some(p => p.name === permName);
        console.log(`   • ${permName}: ${hasPermission ? '✅' : '❌'}`);
      }
      
      // Check what permissions State Admin is missing compared to Super Admin
      const missingPermissions = allPermissions.filter(p => 
        !stateAdminRole.permissions.some(sp => sp._id.toString() === p._id.toString())
      );
      
      if (missingPermissions.length > 0) {
        console.log(`\n   Missing Permissions (${missingPermissions.length}):`);
        missingPermissions.forEach(p => {
          console.log(`   • ${p.name} (${p.securityLevel})`);
        });
      }
    }

    // Check District Admin role
    const districtAdminRole = await Role.findOne({ name: 'district_admin' }).populate('permissions');
    if (districtAdminRole) {
      console.log(`\n🏢 District Administrator:`);
      console.log(`   • Role ID: ${districtAdminRole._id}`);
      console.log(`   • Permissions: ${districtAdminRole.permissions.length}/${allPermissions.length}`);
      
      // Check for specific regional permissions
      const regionalPermissions = [
        'users.create', 'beneficiaries.create', 'applications.approve',
        'interviews.schedule', 'donors.create', 'communications.send'
      ];
      
      console.log(`\n   Regional Permissions Check:`);
      for (const permName of regionalPermissions) {
        const hasPermission = districtAdminRole.permissions.some(p => p.name === permName);
        console.log(`   • ${permName}: ${hasPermission ? '✅' : '❌'}`);
      }
    }

    // Check for users with admin roles
    console.log(`\n👥 Admin Users:`);
    const adminUsers = await User.find({ 
      role: { $in: ['super_admin', 'state_admin', 'district_admin'] } 
    });
    
    for (const user of adminUsers) {
      console.log(`   • ${user.name} (${user.email}) - Role: ${user.role}`);
    }

    // Check menu permissions mapping
    console.log(`\n📋 Menu Permissions Mapping:`);
    const menuPermissions = {
      'Dashboard': [],
      'Projects': ['projects.read.all', 'projects.read.assigned'],
      'Schemes': ['schemes.read.all', 'schemes.read.assigned'],
      'Applications': ['applications.read.all', 'applications.read.regional'],
      'Beneficiaries': ['beneficiaries.read.all', 'beneficiaries.read.regional'],
      'Form Builder': ['forms.read', 'forms.create', 'forms.manage'],
      'User Management': ['users.read.all', 'users.read.regional'],
      'Role Management': ['roles.read'],
      'Debug Permissions': ['system.debug', 'permissions.read'],
      'Settings': ['settings.read', 'settings.update']
    };

    for (const [menu, permissions] of Object.entries(menuPermissions)) {
      console.log(`\n   ${menu}:`);
      if (permissions.length === 0) {
        console.log(`     • No permissions required (all users)`);
      } else {
        for (const perm of permissions) {
          const permExists = allPermissions.some(p => p.name === perm);
          console.log(`     • ${perm}: ${permExists ? '✅' : '❌'}`);
        }
      }
    }

    console.log('\n✅ Permission verification completed!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the verification
verifyAdminPermissions();