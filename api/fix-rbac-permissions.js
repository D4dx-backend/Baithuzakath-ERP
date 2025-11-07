const mongoose = require('mongoose');
const config = require('./src/config/environment');
const { User, Role, Permission, UserRole } = require('./src/models');

async function fixRBACPermissions() {
  try {
    console.log('🔧 Fixing RBAC permissions for state_admin users...\n');

    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all state_admin users
    const stateAdmins = await User.find({ role: 'state_admin' });
    console.log(`📋 Found ${stateAdmins.length} state_admin users\n`);

    // Find the state_admin role in RBAC system
    const stateAdminRole = await Role.findOne({ name: 'state_admin' })
      .populate('permissions');
    
    if (!stateAdminRole) {
      console.log('❌ state_admin role not found in RBAC system');
      console.log('🔄 Initializing RBAC system...\n');
      
      const rbacService = require('./src/services/rbacService');
      await rbacService.initializeRBAC();
      
      // Try to find the role again
      const retryRole = await Role.findOne({ name: 'state_admin' })
        .populate('permissions');
      
      if (!retryRole) {
        console.log('❌ Failed to create state_admin role');
        process.exit(1);
      }
      
      console.log(`✅ state_admin role created with ${retryRole.permissions.length} permissions\n`);
    } else {
      console.log(`✅ state_admin role found with ${stateAdminRole.permissions.length} permissions\n`);
    }

    // Check if permissions.read exists
    const permissionsReadPerm = await Permission.findOne({ name: 'permissions.read' });
    if (!permissionsReadPerm) {
      console.log('❌ permissions.read permission not found');
      process.exit(1);
    }
    console.log('✅ permissions.read permission exists\n');

    // Assign state_admin role to all state_admin users
    for (const user of stateAdmins) {
      console.log(`\n👤 Processing user: ${user.name} (${user.email})`);
      
      // Check if user already has the role assigned
      const existingAssignment = await UserRole.findOne({
        user: user._id,
        role: stateAdminRole._id,
        isActive: true
      });

      if (existingAssignment) {
        console.log('   ✓ User already has state_admin role assigned');
      } else {
        // Assign the role
        const userRole = new UserRole({
          user: user._id,
          role: stateAdminRole._id,
          assignedBy: user._id, // Self-assigned for migration
          assignedAt: new Date(),
          isActive: true,
          isPrimary: true,
          approvalStatus: 'approved',
          approvedBy: user._id,
          approvedAt: new Date(),
          scope: {
            level: 'state',
            regions: user.regions || []
          },
          metadata: {
            reason: 'RBAC migration - automatic role assignment',
            source: 'migration_script'
          }
        });

        await userRole.save();
        console.log('   ✅ Assigned state_admin role to user');
      }

      // Verify permissions
      const rbacService = require('./src/services/rbacService');
      const hasPermission = await rbacService.hasPermission(user._id, 'permissions.read');
      console.log(`   ${hasPermission ? '✅' : '❌'} User has permissions.read: ${hasPermission}`);
    }

    console.log('\n✅ RBAC permissions fixed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Processed ${stateAdmins.length} state_admin users`);
    console.log(`   - state_admin role has ${stateAdminRole.permissions.length} permissions`);
    console.log('\n🔄 Please restart your API server for changes to take effect.');

  } catch (error) {
    console.error('\n❌ Error fixing RBAC permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the fix
fixRBACPermissions();
