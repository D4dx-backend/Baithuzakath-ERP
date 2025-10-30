const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath-erp');

const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Permission = require('./src/models/Permission');

async function directRBACFix() {
  try {
    console.log('🔧 Direct RBAC fix...\n');

    // Step 1: Create missing reports permissions
    console.log('📋 Step 1: Creating missing reports permissions...');
    
    const missingPermissions = [
      {
        name: 'reports.read',
        displayName: 'Read Reports',
        description: 'View and read reports',
        module: 'reports',
        category: 'read',
        resource: 'report',
        action: 'read',
        scope: 'regional',
        securityLevel: 'internal'
      },
      {
        name: 'reports.create',
        displayName: 'Create Reports',
        description: 'Create new reports',
        module: 'reports',
        category: 'create',
        resource: 'report',
        action: 'create',
        scope: 'regional',
        securityLevel: 'internal'
      },
      {
        name: 'reports.update',
        displayName: 'Update Reports',
        description: 'Update existing reports',
        module: 'reports',
        category: 'update',
        resource: 'report',
        action: 'update',
        scope: 'regional',
        securityLevel: 'internal'
      },
      {
        name: 'reports.delete',
        displayName: 'Delete Reports',
        description: 'Delete reports',
        module: 'reports',
        category: 'delete',
        resource: 'report',
        action: 'delete',
        scope: 'regional',
        securityLevel: 'confidential'
      }
    ];

    for (const permData of missingPermissions) {
      const existingPerm = await Permission.findOne({ name: permData.name });
      
      if (!existingPerm) {
        const newPerm = new Permission(permData);
        await newPerm.save();
        console.log(`   ➕ Created: ${permData.name}`);
      } else {
        console.log(`   ✅ Exists: ${permData.name}`);
      }
    }

    // Step 2: Add new permissions to roles
    console.log('\n👥 Step 2: Adding permissions to roles...');
    
    const newPermissions = await Permission.find({ 
      name: { $in: ['reports.read', 'reports.create', 'reports.update', 'reports.delete'] }
    });

    const rolePermissionMap = {
      'super_admin': ['reports.read', 'reports.create', 'reports.update', 'reports.delete'],
      'state_admin': ['reports.read', 'reports.create', 'reports.update', 'reports.delete'],
      'district_admin': ['reports.read', 'reports.create', 'reports.update'],
      'area_admin': ['reports.read', 'reports.create', 'reports.update'],
      'unit_admin': ['reports.read', 'reports.create', 'reports.update'],
      'project_coordinator': ['reports.read'],
      'scheme_coordinator': ['reports.read']
    };

    for (const [roleName, permNames] of Object.entries(rolePermissionMap)) {
      const role = await Role.findOne({ name: roleName });
      if (role) {
        const permsToAdd = newPermissions.filter(p => permNames.includes(p.name));
        
        for (const perm of permsToAdd) {
          if (!role.permissions.includes(perm._id)) {
            role.permissions.push(perm._id);
          }
        }
        
        await role.save();
        console.log(`   ✅ Updated ${roleName} with ${permsToAdd.length} new permissions`);
      }
    }

    // Step 3: Assign roles to users
    console.log('\n👤 Step 3: Assigning roles to users...');
    
    const userRoleAssignments = [
      { email: 'admin@baithuzzakath.org', roleName: 'super_admin' },
      { email: 'district.tvm@baithuzzakath.org', roleName: 'district_admin' },
      { email: 'area.tvmcity@baithuzzakath.org', roleName: 'area_admin' },
      { email: 'unit.pettah@baithuzzakath.org', roleName: 'unit_admin' }
    ];

    for (const assignment of userRoleAssignments) {
      const user = await User.findOne({ email: assignment.email });
      
      if (user) {
        user.role = assignment.roleName;
        await user.save();
        console.log(`   ✅ Assigned ${assignment.roleName} to ${user.name}`);
      } else {
        console.log(`   ❌ Failed: ${assignment.email} - User not found`);
      }
    }

    // Step 4: Verify the fix
    console.log('\n🔍 Step 4: Verifying the fix...');
    
    const superAdmin = await User.findOne({ email: 'admin@baithuzzakath.org' });
    
    if (superAdmin) {
      console.log(`\nSuper Admin role: ${superAdmin.role}`);
      
      // Check the role's permissions
      const superAdminRole = await Role.findOne({ name: superAdmin.role })
        .populate('permissions', 'name');
      
      if (superAdminRole) {
        const reportsPerms = superAdminRole.permissions.filter(p => 
          p.name.startsWith('reports.')
        );
        console.log(`Super Admin role has ${reportsPerms.length} reports permissions:`);
        reportsPerms.forEach(perm => {
          console.log(`   ✅ ${perm.name}`);
        });
      }
    }

    console.log('\n🎉 RBAC fix completed successfully!');
    console.log('\n🚨 IMPORTANT: Users must log out and log back in to refresh their JWT tokens!');

  } catch (error) {
    console.error('❌ Error in direct RBAC fix:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
directRBACFix();