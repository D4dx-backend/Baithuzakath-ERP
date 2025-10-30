#!/usr/bin/env node

/**
 * Script to add donor and donation permissions to the RBAC system
 * Run this script to update existing roles with new donor permissions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Permission, Role } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

// Donor permissions to add
const donorPermissions = [
  {
    name: 'donors.create',
    displayName: 'Create Donors',
    description: 'Register new donors',
    module: 'donors',
    category: 'create',
    resource: 'donor',
    action: 'create',
    scope: 'regional',
    securityLevel: 'internal'
  },
  {
    name: 'donors.read',
    displayName: 'View Donors',
    description: 'View donor information',
    module: 'donors',
    category: 'read',
    resource: 'donor',
    action: 'read',
    scope: 'regional',
    securityLevel: 'internal'
  },
  {
    name: 'donors.read.regional',
    displayName: 'View Regional Donors',
    description: 'View donors within assigned regions',
    module: 'donors',
    category: 'read',
    resource: 'donor',
    action: 'read',
    scope: 'regional',
    securityLevel: 'internal'
  },
  {
    name: 'donors.read.all',
    displayName: 'View All Donors',
    description: 'View all donor records',
    module: 'donors',
    category: 'read',
    resource: 'donor',
    action: 'read',
    scope: 'global',
    securityLevel: 'confidential'
  },
  {
    name: 'donors.update.regional',
    displayName: 'Update Regional Donors',
    description: 'Update donor records within assigned regions',
    module: 'donors',
    category: 'update',
    resource: 'donor',
    action: 'update',
    scope: 'regional',
    securityLevel: 'internal'
  },
  {
    name: 'donors.delete',
    displayName: 'Delete Donors',
    description: 'Delete donor records',
    module: 'donors',
    category: 'delete',
    resource: 'donor',
    action: 'delete',
    scope: 'regional',
    securityLevel: 'confidential',
    auditRequired: true
  },
  {
    name: 'donors.verify',
    displayName: 'Verify Donors',
    description: 'Verify donor information',
    module: 'donors',
    category: 'verify',
    resource: 'donor',
    action: 'verify',
    scope: 'regional',
    securityLevel: 'confidential',
    auditRequired: true
  },
  {
    name: 'donations.create',
    displayName: 'Record Donations',
    description: 'Record new donations',
    module: 'donations',
    category: 'create',
    resource: 'donation',
    action: 'create',
    scope: 'regional',
    securityLevel: 'internal'
  },
  {
    name: 'donations.read.regional',
    displayName: 'View Regional Donations',
    description: 'View donations within assigned regions',
    module: 'donations',
    category: 'read',
    resource: 'donation',
    action: 'read',
    scope: 'regional',
    securityLevel: 'internal'
  },
  {
    name: 'donations.read.all',
    displayName: 'View All Donations',
    description: 'View all donation records',
    module: 'donations',
    category: 'read',
    resource: 'donation',
    action: 'read',
    scope: 'global',
    securityLevel: 'confidential'
  },
  {
    name: 'donations.update.regional',
    displayName: 'Update Regional Donations',
    description: 'Update donation records within assigned regions',
    module: 'donations',
    category: 'update',
    resource: 'donation',
    action: 'update',
    scope: 'regional',
    securityLevel: 'internal'
  },
  {
    name: 'communications.send',
    displayName: 'Send Communications',
    description: 'Send communications to donors and beneficiaries',
    module: 'communications',
    category: 'send',
    resource: 'communication',
    action: 'send',
    scope: 'regional',
    securityLevel: 'internal',
    auditRequired: true
  }
];

// Role permission mappings
const rolePermissionMappings = {
  super_admin: 'all', // Gets all permissions automatically
  state_admin: [
    'donors.create', 'donors.read', 'donors.read.all', 'donors.read.regional', 
    'donors.update.regional', 'donors.delete', 'donors.verify',
    'donations.create', 'donations.read.all', 'donations.read.regional', 
    'donations.update.regional',
    'communications.send'
  ],
  district_admin: [
    'donors.create', 'donors.read', 'donors.read.regional', 
    'donors.update.regional', 'donors.verify',
    'donations.create', 'donations.read.regional', 'donations.update.regional',
    'communications.send'
  ],
  area_admin: [
    'donors.create', 'donors.read', 'donors.read.regional', 'donors.update.regional',
    'donations.create', 'donations.read.regional', 'donations.update.regional',
    'communications.send'
  ]
};

async function updateDonorPermissions() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Create/Update donor permissions
    console.log('\n📝 Creating donor permissions...');
    const createdPermissions = {};
    
    for (const permData of donorPermissions) {
      const permission = await Permission.findOneAndUpdate(
        { name: permData.name },
        {
          ...permData,
          isActive: true,
          isSystem: true
        },
        { upsert: true, new: true }
      );
      
      createdPermissions[permData.name] = permission._id;
      console.log(`  ✅ ${permData.name}`);
    }

    // Step 2: Update roles with new permissions
    console.log('\n🔐 Updating roles with donor permissions...');
    
    for (const [roleName, permissions] of Object.entries(rolePermissionMappings)) {
      const role = await Role.findOne({ name: roleName });
      
      if (!role) {
        console.log(`  ⚠️  Role ${roleName} not found, skipping...`);
        continue;
      }

      if (permissions === 'all') {
        // Super admin gets all permissions
        const allPermissions = await Permission.find({ isActive: true });
        role.permissions = allPermissions.map(p => p._id);
        console.log(`  ✅ ${roleName}: Updated with ALL permissions (${allPermissions.length} total)`);
      } else {
        // Add specific permissions to role
        const permissionIds = permissions.map(pName => createdPermissions[pName]).filter(Boolean);
        
        // Add new permissions to existing ones (avoid duplicates)
        const existingPermissionIds = role.permissions.map(p => p.toString());
        const newPermissionIds = permissionIds.filter(
          pId => !existingPermissionIds.includes(pId.toString())
        );
        
        if (newPermissionIds.length > 0) {
          role.permissions.push(...newPermissionIds);
          console.log(`  ✅ ${roleName}: Added ${newPermissionIds.length} new permissions`);
        } else {
          console.log(`  ℹ️  ${roleName}: Already has all donor permissions`);
        }
      }

      await role.save();
    }

    console.log('\n✅ Donor permissions update completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Created/Updated ${donorPermissions.length} permissions`);
    console.log(`  - Updated ${Object.keys(rolePermissionMappings).length} roles`);
    
  } catch (error) {
    console.error('\n❌ Error updating donor permissions:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateDonorPermissions()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
