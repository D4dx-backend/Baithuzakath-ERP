/**
 * Script to add configuration permissions to super_admin role
 * Run with: node src/scripts/addConfigPermissions.js
 */

const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
require('dotenv').config();

const configPermissions = [
  {
    name: 'config.read',
    displayName: 'Read Application Configuration',
    description: 'View application configuration settings',
    module: 'settings',
    category: 'read',
    scope: 'global',
    resource: 'application_config',
    action: 'read'
  },
  {
    name: 'config.write',
    displayName: 'Write Application Configuration',
    description: 'Update application configuration settings',
    module: 'settings',
    category: 'update',
    scope: 'global',
    resource: 'application_config',
    action: 'update'
  }
];

async function addConfigPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create or find permissions
    const permissionIds = [];
    
    for (const permData of configPermissions) {
      let permission = await Permission.findOne({ name: permData.name });
      
      if (!permission) {
        permission = await Permission.create(permData);
        console.log(`✅ Created permission: ${permission.name}`);
      } else {
        console.log(`⏭️  Permission already exists: ${permission.name}`);
      }
      
      permissionIds.push(permission._id);
    }

    // Find super_admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    
    if (!superAdminRole) {
      console.error('❌ super_admin role not found!');
      process.exit(1);
    }

    console.log(`\n📋 Found role: ${superAdminRole.name} (${superAdminRole.displayName})`);

    // Get current permission IDs
    const currentPermissionIds = superAdminRole.permissions.map(p => p.toString());
    
    // Add new permissions if not already present
    let addedCount = 0;
    for (const permId of permissionIds) {
      if (!currentPermissionIds.includes(permId.toString())) {
        superAdminRole.permissions.push(permId);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await superAdminRole.save();
      console.log(`✅ Added ${addedCount} permission(s) to super_admin role`);
    } else {
      console.log('⏭️  All permissions already assigned to super_admin role');
    }

    // Display all permissions for super_admin
    const populatedRole = await Role.findById(superAdminRole._id)
      .populate('permissions', 'name displayName module category');
    
    console.log('\n📊 Super Admin Permissions Summary:');
    console.log('====================================');
    console.log(`Total Permissions: ${populatedRole.permissions.length}`);
    
    // Group by module
    const groupedPerms = populatedRole.permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    }, {});

    // Display config/settings permissions
    console.log('\n🔧 Configuration & Settings Permissions:');
    const configSettingsPerms = populatedRole.permissions.filter(p => 
      p.module === 'settings' || p.name.startsWith('config.')
    );
    
    if (configSettingsPerms.length > 0) {
      configSettingsPerms.forEach(perm => {
        console.log(`  ✓ ${perm.name} - ${perm.displayName}`);
      });
    } else {
      console.log('  (none)');
    }

    console.log('\n✅ Script completed successfully!');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding config permissions:', error);
    process.exit(1);
  }
}

// Run the script
addConfigPermissions();
