#!/usr/bin/env node

/**
 * Update RBAC Permissions Script
 * 
 * This script updates the RBAC system to ensure Super Administrator and State Administrator
 * have access to all necessary permissions and menus.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Role, Permission, User, UserRole } = require('./src/models');
const rbacService = require('./src/services/rbacService');

async function updateRBACPermissions() {
  try {
    console.log('🔄 Starting RBAC permissions update...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath');
    console.log('✅ Connected to MongoDB');

    // Reinitialize RBAC system to create new permissions
    console.log('🔄 Reinitializing RBAC system...');
    await rbacService.initializeRBAC();

    // Get all permissions
    const allPermissions = await Permission.find({ isActive: true });
    console.log(`📋 Found ${allPermissions.length} total permissions`);

    // Update Super Admin role to have ALL permissions
    console.log('🔄 Updating Super Administrator permissions...');
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (superAdminRole) {
      superAdminRole.permissions = allPermissions.map(p => p._id);
      await superAdminRole.save();
      console.log(`✅ Super Admin now has ${allPermissions.length} permissions`);
    }

    // Update State Admin role with comprehensive permissions
    console.log('🔄 Updating State Administrator permissions...');
    const stateAdminRole = await Role.findOne({ name: 'state_admin' });
    if (stateAdminRole) {
      // State Admin gets all permissions except the most sensitive system ones
      const stateAdminPermissions = allPermissions.filter(p => 
        p.securityLevel !== 'top_secret' || 
        p.name.startsWith('settings.') || 
        p.name.startsWith('system.') ||
        p.name === 'finances.manage'  // State Admin needs financial management
      );
      stateAdminRole.permissions = stateAdminPermissions.map(p => p._id);
      await stateAdminRole.save();
      console.log(`✅ State Admin now has ${stateAdminPermissions.length} permissions`);
    }

    // Update District Admin role with enhanced permissions
    console.log('🔄 Updating District Administrator permissions...');
    const districtAdminRole = await Role.findOne({ name: 'district_admin' });
    if (districtAdminRole) {
      const districtPermissionNames = [
        // User Management
        'users.create', 'users.read.regional', 'users.update.regional',
        'roles.read', 'roles.assign',
        
        // Beneficiary Management
        'beneficiaries.create', 'beneficiaries.read.regional', 'beneficiaries.update.regional',
        
        // Application Management
        'applications.read.regional', 'applications.update.regional', 'applications.approve',
        
        // Project and Scheme Management
        'projects.read.all', 'projects.read.assigned', 'projects.update.assigned',
        'schemes.read.all', 'schemes.read.assigned', 'schemes.update.assigned',
        
        // Reports and Finance
        'reports.read.regional', 'reports.export',
        'finances.read.regional',
        
        // Donor Management
        'donors.create', 'donors.read', 'donors.read.regional', 'donors.update.regional', 'donors.verify',
        'donations.create', 'donations.read.regional', 'donations.update.regional',
        
        // Communication
        'communications.send',
        
        // Location and Dashboard
        'locations.read',
        'dashboard.read.regional',
        
        // Interview Management
        'interviews.schedule', 'interviews.read', 'interviews.update', 'interviews.cancel'
      ];

      const districtPermissions = await Permission.find({ 
        name: { $in: districtPermissionNames },
        isActive: true 
      });
      
      districtAdminRole.permissions = districtPermissions.map(p => p._id);
      await districtAdminRole.save();
      console.log(`✅ District Admin now has ${districtPermissions.length} permissions`);
    }

    // Verify permissions for existing users
    console.log('🔄 Verifying user permissions...');
    const superAdmins = await User.find({ role: 'super_admin' });
    const stateAdmins = await User.find({ role: 'state_admin' });
    
    console.log(`📊 Found ${superAdmins.length} Super Administrators`);
    console.log(`📊 Found ${stateAdmins.length} State Administrators`);

    // Display permission summary
    console.log('\n📋 Permission Summary:');
    console.log('='.repeat(50));
    
    const permissionsByModule = {};
    allPermissions.forEach(p => {
      if (!permissionsByModule[p.module]) {
        permissionsByModule[p.module] = [];
      }
      permissionsByModule[p.module].push(p.name);
    });

    Object.keys(permissionsByModule).sort().forEach(module => {
      console.log(`📁 ${module.toUpperCase()}: ${permissionsByModule[module].length} permissions`);
      permissionsByModule[module].forEach(perm => {
        console.log(`   - ${perm}`);
      });
    });

    console.log('\n✅ RBAC permissions update completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   • Total Permissions: ${allPermissions.length}`);
    console.log(`   • Super Admin Permissions: ${allPermissions.length} (ALL)`);
    console.log(`   • State Admin Permissions: ${stateAdminRole ? stateAdminRole.permissions.length : 'N/A'}`);
    console.log(`   • District Admin Permissions: ${districtAdminRole ? districtAdminRole.permissions.length : 'N/A'}`);

    console.log('\n🎯 Next Steps:');
    console.log('   1. Restart your application server');
    console.log('   2. Clear browser cache and refresh');
    console.log('   3. Test Super Admin and State Admin access to all menus');
    console.log('   4. Verify permissions are working correctly');

  } catch (error) {
    console.error('❌ RBAC update failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateRBACPermissions();