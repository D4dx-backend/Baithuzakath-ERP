const mongoose = require('mongoose');
const config = require('./src/config/environment');
const { User, Role, Permission, UserRole } = require('./src/models');

async function updateAdminPermissions() {
  try {
    console.log('🔧 Updating admin role permissions...\n');

    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find the permissions.read permission
    const permissionsReadPerm = await Permission.findOne({ name: 'permissions.read' });
    if (!permissionsReadPerm) {
      console.log('❌ permissions.read permission not found');
      process.exit(1);
    }
    console.log('✅ Found permissions.read permission\n');

    // Update district_admin role
    console.log('📋 Updating district_admin role...');
    const districtAdminRole = await Role.findOne({ name: 'district_admin' });
    if (districtAdminRole) {
      if (!districtAdminRole.permissions.includes(permissionsReadPerm._id)) {
        districtAdminRole.permissions.push(permissionsReadPerm._id);
        await districtAdminRole.save();
        console.log('   ✅ Added permissions.read to district_admin');
      } else {
        console.log('   ✓ district_admin already has permissions.read');
      }
    }

    // Update area_admin role
    console.log('📋 Updating area_admin role...');
    const areaAdminRole = await Role.findOne({ name: 'area_admin' });
    if (areaAdminRole) {
      if (!areaAdminRole.permissions.includes(permissionsReadPerm._id)) {
        areaAdminRole.permissions.push(permissionsReadPerm._id);
        await areaAdminRole.save();
        console.log('   ✅ Added permissions.read to area_admin');
      } else {
        console.log('   ✓ area_admin already has permissions.read');
      }
    }

    // Update unit_admin role
    console.log('📋 Updating unit_admin role...');
    const unitAdminRole = await Role.findOne({ name: 'unit_admin' });
    if (unitAdminRole) {
      if (!unitAdminRole.permissions.includes(permissionsReadPerm._id)) {
        unitAdminRole.permissions.push(permissionsReadPerm._id);
        await unitAdminRole.save();
        console.log('   ✅ Added permissions.read to unit_admin');
      } else {
        console.log('   ✓ unit_admin already has permissions.read');
      }
    }

    console.log('\n✅ Admin permissions updated successfully!');
    console.log('\n📝 Summary:');
    console.log('   - district_admin, area_admin, and unit_admin now have permissions.read');
    console.log('   - Users with these roles can now access the Role Management page');
    console.log('\n🔄 Please restart your API server for changes to take effect.');

    // Test with a district_admin user
    console.log('\n🧪 Testing with district_admin users...');
    const districtAdmins = await User.find({ role: 'district_admin' });
    console.log(`   Found ${districtAdmins.length} district_admin users`);

    for (const user of districtAdmins) {
      const rbacService = require('./src/services/rbacService');
      const hasPermission = await rbacService.hasPermission(user._id, 'permissions.read');
      console.log(`   ${hasPermission ? '✅' : '❌'} ${user.name}: permissions.read = ${hasPermission}`);
    }

  } catch (error) {
    console.error('\n❌ Error updating permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the update
updateAdminPermissions();
