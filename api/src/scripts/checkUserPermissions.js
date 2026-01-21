const mongoose = require('mongoose');
require('dotenv').config();
const { User, UserRole, Permission } = require('../models');
const rbacService = require('../services/rbacService');

/**
 * Script to check what permissions a user currently has
 */

async function checkUserPermissions() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get user email from command line
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.log('❌ Please provide user email as argument');
      console.log('Usage: node checkUserPermissions.js <user-email>');
      process.exit(1);
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log(`\n👤 User: ${user.name} (${user.email})`);
    console.log(`   System Role: ${user.role}`);
    console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);

    // Get user's active roles
    const userRoles = await UserRole.find({ 
      user: user._id, 
      isActive: true,
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: null },
        { validUntil: { $gte: new Date() } }
      ]
    }).populate('role');

    console.log(`\n📊 Active Roles (${userRoles.length}):`);
    if (userRoles.length === 0) {
      console.log('   ⚠️  No active roles assigned');
    } else {
      userRoles.forEach(ur => {
        console.log(`   - ${ur.role.displayName} (${ur.role.name})`);
        if (ur.isPrimary) console.log(`     [PRIMARY ROLE]`);
        if (ur.scope) {
          if (ur.scope.regions?.length > 0) {
            console.log(`     Regions: ${ur.scope.regions.length}`);
          }
          if (ur.scope.projects?.length > 0) {
            console.log(`     Projects: ${ur.scope.projects.length}`);
          }
          if (ur.scope.schemes?.length > 0) {
            console.log(`     Schemes: ${ur.scope.schemes.length}`);
          }
        }
      });
    }

    // Get all permissions for the user
    console.log(`\n🔍 Fetching all permissions...`);
    const permissionIds = await rbacService.getUserPermissions(user._id);
    const permissions = await Permission.find({
      _id: { $in: permissionIds }
    }).sort({ module: 1, category: 1, name: 1 });

    console.log(`\n🔐 Total Permissions: ${permissions.length}`);

    // Group by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});

    console.log(`\n📋 Permissions by Module:`);
    Object.keys(groupedPermissions).sort().forEach(module => {
      console.log(`\n   ${module.toUpperCase()} (${groupedPermissions[module].length}):`);
      groupedPermissions[module].forEach(p => {
        console.log(`      ✓ ${p.name} - ${p.displayName}`);
      });
    });

    // Check for dashboard-specific permissions
    const dashboardPermissions = [
      'finances.read.regional',
      'donors.read.regional',
      'applications.read.regional',
      'beneficiaries.read.regional',
      'users.read.regional'
    ];

    console.log(`\n🎯 Dashboard Permission Check:`);
    const userPermissionNames = permissions.map(p => p.name);
    dashboardPermissions.forEach(perm => {
      const has = userPermissionNames.includes(perm);
      console.log(`   ${has ? '✅' : '❌'} ${perm}`);
    });

    const missingDashboardPerms = dashboardPermissions.filter(p => !userPermissionNames.includes(p));
    if (missingDashboardPerms.length > 0) {
      console.log(`\n⚠️  Missing ${missingDashboardPerms.length} dashboard permissions`);
      console.log(`\n💡 To grant dashboard permissions, run:`);
      console.log(`   node src/scripts/grantDashboardPermissions.js ${userEmail}`);
    } else {
      console.log(`\n✅ User has all required dashboard permissions!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
checkUserPermissions();
