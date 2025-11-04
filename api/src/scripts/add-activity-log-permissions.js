const mongoose = require('mongoose');
const { Permission, Role } = require('../models');
require('dotenv').config();

const activityLogPermissions = [
  {
    name: 'activity_logs.read',
    displayName: 'View Activity Logs',
    description: 'View system activity logs and audit trails',
    module: 'activity_logs',
    category: 'read',
    resource: 'activity_log',
    action: 'read',
    scope: 'global',
    securityLevel: 'restricted'
  },
  {
    name: 'activity_logs.export',
    displayName: 'Export Activity Logs',
    description: 'Export activity logs to various formats',
    module: 'activity_logs',
    category: 'export',
    resource: 'activity_log',
    action: 'export',
    scope: 'global',
    securityLevel: 'restricted',
    auditRequired: true
  },
  {
    name: 'activity_logs.delete',
    displayName: 'Delete Activity Logs',
    description: 'Clean up old activity logs',
    module: 'activity_logs',
    category: 'delete',
    resource: 'activity_log',
    action: 'delete',
    scope: 'global',
    securityLevel: 'top_secret',
    auditRequired: true
  }
];

async function addActivityLogPermissions() {
  try {
    console.log('🔐 Adding Activity Log permissions...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database');

    // Create permissions
    const createdPermissions = [];
    for (const permissionData of activityLogPermissions) {
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
      }
    }

    // Add permissions to super_admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (superAdminRole) {
      const newPermissionIds = createdPermissions.map(p => p._id);
      
      // Add new permissions to super admin if not already present
      const permissionsToAdd = newPermissionIds.filter(id => 
        !superAdminRole.permissions.includes(id)
      );
      
      if (permissionsToAdd.length > 0) {
        superAdminRole.permissions.push(...permissionsToAdd);
        await superAdminRole.save();
        console.log(`✅ Added ${permissionsToAdd.length} permissions to super_admin role`);
      }
    }

    // Add read permission to state_admin role
    const stateAdminRole = await Role.findOne({ name: 'state_admin' });
    if (stateAdminRole) {
      const readPermission = await Permission.findOne({ name: 'activity_logs.read' });
      if (readPermission && !stateAdminRole.permissions.includes(readPermission._id)) {
        stateAdminRole.permissions.push(readPermission._id);
        await stateAdminRole.save();
        console.log('✅ Added activity_logs.read permission to state_admin role');
      }
    }

    console.log('🎉 Activity Log permissions setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error adding Activity Log permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  addActivityLogPermissions();
}

module.exports = addActivityLogPermissions;