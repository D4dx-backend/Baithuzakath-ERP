const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath-erp');

const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Permission = require('./src/models/Permission');
const rbacService = require('./src/services/rbacService');

async function fixRBACComplete() {
  try {
    console.log('🔧 Fixing RBAC system completely...\n');

    // Step 1: Update permissions
    console.log('📋 Step 1: Updating permissions...');
    const permissionsData = rbacService.getPermissions();
    
    for (const permData of permissionsData) {
      const existingPerm = await Permission.findOne({ name: permData.name });
      
      if (existingPerm) {
        Object.assign(existingPerm, permData);
        await existingPerm.save();
        console.log(`   ✅ Updated: ${permData.name}`);
      } else {
        const newPerm = new Permission(permData);
        await newPerm.save();
        console.log(`   ➕ Created: ${permData.name}`);
      }
    }

    // Step 2: Update roles
    console.log('\n👥 Step 2: Updating roles...');
    const rolesData = rbacService.getRoles();
    
    for (const roleData of rolesData) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        const permissions = await Permission.find({ 
          name: { $in: roleData.permissions } 
        }).select('_id');
        
        existingRole.permissions = permissions.map(p => p._id);
        existingRole.description = roleData.description;
        existingRole.level = roleData.level;
        existingRole.isSystemRole = roleData.isSystemRole;
        
        await existingRole.save();
        console.log(`   ✅ Updated: ${roleData.name} (${permissions.length} permissions)`);
      } else {
        console.log(`   ⏭️  Skipped: ${roleData.name} (role doesn't exist)`);
      }
    }

    // Step 3: Assign roles to users
    console.log('\n👤 Step 3: Assigning roles to users...');
    
    const userRoleAssignments = [
      { email: 'admin@baithuzzakath.org', roleName: 'super_admin' },
      { email: 'district.tvm@baithuzzakath.org', roleName: 'district_admin' },
      { email: 'area.tvmcity@baithuzzakath.org', roleName: 'area_admin' },
      { email: 'unit.pettah@baithuzzakath.org', roleName: 'unit_admin' },
      { email: 'beneficiary@example.com', roleName: 'beneficiary' }
    ];

    for (const assignment of userRoleAssignments) {
      const user = await User.findOne({ email: assignment.email });
      const role = await Role.findOne({ name: assignment.roleName });
      
      if (user && role) {
        user.role = role._id;
        await user.save();
        console.log(`   ✅ Assigned ${assignment.roleName} to ${user.name} (${user.email})`);
      } else {
        console.log(`   ❌ Failed to assign role: User or role not found for ${assignment.email}`);
      }
    }

    // Step 4: Verify the fix
    console.log('\n🔍 Step 4: Verifying the fix...');
    
    // Check reports permissions
    const reportsPermissions = await Permission.find({ 
      name: { $regex: /^reports\./i } 
    }).select('name');
    
    console.log(`\nReports permissions in database (${reportsPermissions.length}):`);
    reportsPermissions.forEach(perm => {
      console.log(`   - ${perm.name}`);
    });

    // Check super admin user
    const superAdmin = await User.findOne({ email: 'admin@baithuzzakath.org' })
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          model: 'Permission'
        }
      });

    if (superAdmin && superAdmin.role) {
      const userReportsPerms = superAdmin.role.permissions.filter(p => 
        p.name.startsWith('reports.')
      );
      console.log(`\nSuper Admin reports permissions (${userReportsPerms.length}):`);
      userReportsPerms.forEach(perm => {
        console.log(`   - ${perm.name}`);
      });
    }

    console.log('\n✅ RBAC system fixed completely!');
    console.log('\n🎯 Next steps:');
    console.log('1. Users need to log out and log back in to refresh their JWT tokens');
    console.log('2. Frontend should now work with reports permissions');
    console.log('3. Test the reports functionality');

  } catch (error) {
    console.error('❌ Error fixing RBAC:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixRBACComplete();