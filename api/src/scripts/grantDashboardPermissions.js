const mongoose = require('mongoose');
require('dotenv').config();
const { User, Role, UserRole } = require('../models');

/**
 * Script to grant dashboard-related permissions to a user
 * This will help resolve 403 errors on the dashboard
 */

async function grantDashboardPermissions() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get user email from command line or use default
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.log('❌ Please provide user email as argument');
      console.log('Usage: node grantDashboardPermissions.js <user-email>');
      process.exit(1);
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log(`\n📋 User found: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);

    // Get user's current roles
    const userRoles = await UserRole.find({ 
      user: user._id, 
      isActive: true 
    }).populate('role');

    console.log(`\n📊 Current active roles: ${userRoles.length}`);
    userRoles.forEach(ur => {
      console.log(`   - ${ur.role.displayName} (${ur.role.name})`);
    });

    // Required permissions for dashboard
    const requiredPermissions = [
      'finances.read.regional',
      'donors.read.regional',
      'applications.read.regional',
      'beneficiaries.read.regional',
      'users.read.regional'
    ];

    console.log(`\n🔍 Checking permissions...`);

    // Check if user already has these permissions through their roles
    const { Permission } = require('../models');
    const permissions = await Permission.find({
      name: { $in: requiredPermissions }
    });

    const permissionIds = permissions.map(p => p._id.toString());
    
    let hasAllPermissions = true;
    for (const userRole of userRoles) {
      const rolePermissions = userRole.role.permissions.map(p => p.toString());
      const missingPermissions = permissionIds.filter(p => !rolePermissions.includes(p));
      
      if (missingPermissions.length > 0) {
        hasAllPermissions = false;
        console.log(`   ⚠️  Role "${userRole.role.displayName}" is missing ${missingPermissions.length} permissions`);
      }
    }

    if (hasAllPermissions) {
      console.log(`\n✅ User already has all required dashboard permissions!`);
      process.exit(0);
    }

    // Find or create a suitable role with dashboard permissions
    console.log(`\n🔧 Looking for suitable role with dashboard permissions...`);
    
    // Try to find state_admin or regional_admin role
    let targetRole = await Role.findOne({ 
      name: { $in: ['state_admin', 'regional_admin', 'district_admin'] },
      isActive: true
    });

    if (!targetRole) {
      console.log(`   ⚠️  No suitable admin role found`);
      console.log(`\n💡 Recommendation: Run the RBAC initialization script first:`);
      console.log(`   node src/scripts/initRBACProduction.js`);
      process.exit(1);
    }

    console.log(`   ✅ Found role: ${targetRole.displayName}`);

    // Check if user already has this role
    const existingAssignment = await UserRole.findOne({
      user: user._id,
      role: targetRole._id,
      isActive: true
    });

    if (existingAssignment) {
      console.log(`\n✅ User already has the ${targetRole.displayName} role assigned!`);
      console.log(`\n💡 The permissions should be working. If you're still seeing 403 errors:`);
      console.log(`   1. Try logging out and logging back in`);
      console.log(`   2. Check if the role has the required permissions`);
      console.log(`   3. Verify the JWT token is being sent correctly`);
      process.exit(0);
    }

    // Assign the role to the user
    console.log(`\n🔐 Assigning ${targetRole.displayName} role to user...`);
    
    const rbacService = require('../services/rbacService');
    await rbacService.assignRole(user._id, targetRole._id, user._id, {
      reason: 'Dashboard access - granted via script',
      isPrimary: false,
      scope: {
        regions: [], // Will be populated based on user's location
        projects: [],
        schemes: []
      }
    });

    console.log(`\n✅ Successfully assigned ${targetRole.displayName} role!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Log out and log back in to refresh permissions`);
    console.log(`   2. The dashboard should now load without 403 errors`);
    console.log(`   3. If you need to restrict access to specific regions, update the role scope`);

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
grantDashboardPermissions();
