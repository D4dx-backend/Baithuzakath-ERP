const mongoose = require('mongoose');
const { Permission, Role } = require('../models');
require('dotenv').config();

const websitePermissions = [
  // Website Settings Permissions
  {
    name: 'website.read',
    displayName: 'View Website Settings',
    description: 'View website settings, about us, counters, and contact information',
    module: 'website',
    category: 'read',
    resource: 'website',
    action: 'read',
    scope: 'global',
    securityLevel: 'internal'
  },
  {
    name: 'website.write',
    displayName: 'Manage Website Settings',
    description: 'Create and edit website settings, counters, and contact information',
    module: 'website',
    category: 'manage',
    resource: 'website',
    action: 'manage',
    scope: 'global',
    securityLevel: 'restricted'
  },
  {
    name: 'website.delete',
    displayName: 'Delete Website Content',
    description: 'Delete website counters and other content',
    module: 'website',
    category: 'delete',
    resource: 'website',
    action: 'delete',
    scope: 'global',
    securityLevel: 'restricted'
  },
  
  // News & Events Permissions
  {
    name: 'news.read',
    displayName: 'View News & Events',
    description: 'View news, events, and announcements',
    module: 'news',
    category: 'read',
    resource: 'news',
    action: 'read',
    scope: 'global',
    securityLevel: 'internal'
  },
  {
    name: 'news.write',
    displayName: 'Manage News & Events',
    description: 'Create and edit news, events, and announcements',
    module: 'news',
    category: 'manage',
    resource: 'news',
    action: 'manage',
    scope: 'global',
    securityLevel: 'restricted'
  },
  {
    name: 'news.delete',
    displayName: 'Delete News & Events',
    description: 'Delete news, events, and announcements',
    module: 'news',
    category: 'delete',
    resource: 'news',
    action: 'delete',
    scope: 'global',
    securityLevel: 'restricted'
  },
  
  // Brochures Permissions
  {
    name: 'brochures.read',
    displayName: 'View Brochures',
    description: 'View and download brochures and documents',
    module: 'brochures',
    category: 'read',
    resource: 'brochure',
    action: 'read',
    scope: 'global',
    securityLevel: 'internal'
  },
  {
    name: 'brochures.write',
    displayName: 'Manage Brochures',
    description: 'Upload and edit brochures and documents',
    module: 'brochures',
    category: 'manage',
    resource: 'brochure',
    action: 'manage',
    scope: 'global',
    securityLevel: 'restricted'
  },
  {
    name: 'brochures.delete',
    displayName: 'Delete Brochures',
    description: 'Delete brochures and documents',
    module: 'brochures',
    category: 'delete',
    resource: 'brochure',
    action: 'delete',
    scope: 'global',
    securityLevel: 'restricted'
  }
];

async function addWebsitePermissions() {
  try {
    console.log('🌐 Adding Website Management permissions...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database');

    // Create permissions
    const createdPermissions = [];
    for (const permissionData of websitePermissions) {
      const existingPermission = await Permission.findOne({ name: permissionData.name });
      
      if (!existingPermission) {
        const permission = new Permission({
          ...permissionData,
          type: 'system',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await permission.save();
        createdPermissions.push(permission);
        console.log(`✅ Created permission: ${permissionData.name}`);
      } else {
        console.log(`⚠️  Permission already exists: ${permissionData.name}`);
        createdPermissions.push(existingPermission);
      }
    }

    // Get all permission IDs (both newly created and existing)
    const allPermissionIds = createdPermissions.map(p => p._id);

    // Add all permissions to super_admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (superAdminRole) {
      // Add permissions that don't already exist in the role
      const permissionsToAdd = allPermissionIds.filter(id => 
        !superAdminRole.permissions.some(pId => pId.toString() === id.toString())
      );
      
      if (permissionsToAdd.length > 0) {
        superAdminRole.permissions.push(...permissionsToAdd);
        await superAdminRole.save();
        console.log(`✅ Added ${permissionsToAdd.length} permissions to super_admin role`);
      } else {
        console.log('⚠️  All permissions already exist in super_admin role');
      }
    } else {
      console.log('❌ super_admin role not found');
    }

    // Add all permissions to state_admin role
    const stateAdminRole = await Role.findOne({ name: 'state_admin' });
    if (stateAdminRole) {
      // Add permissions that don't already exist in the role
      const permissionsToAdd = allPermissionIds.filter(id => 
        !stateAdminRole.permissions.some(pId => pId.toString() === id.toString())
      );
      
      if (permissionsToAdd.length > 0) {
        stateAdminRole.permissions.push(...permissionsToAdd);
        await stateAdminRole.save();
        console.log(`✅ Added ${permissionsToAdd.length} permissions to state_admin role`);
      } else {
        console.log('⚠️  All permissions already exist in state_admin role');
      }
    } else {
      console.log('❌ state_admin role not found');
    }

    console.log('\n📋 Summary:');
    console.log(`   - Total permissions processed: ${websitePermissions.length}`);
    console.log(`   - Website permissions: 3 (read, write, delete)`);
    console.log(`   - News permissions: 3 (read, write, delete)`);
    console.log(`   - Brochure permissions: 3 (read, write, delete)`);
    console.log('\n✨ Website management permissions setup complete!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding website permissions:', error);
    process.exit(1);
  }
}

addWebsitePermissions();
