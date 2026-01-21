const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { User, Role, UserRole, Permission } = require('../models');
const rbacService = require('../services/rbacService');
const config = require('../config/environment');

/**
 * Debug User Permissions
 * Usage: node src/scripts/debugUserPermissions.js <email_or_phone>
 */
async function debugUserPermissions() {
  try {
    const userIdentifier = process.argv[2];
    
    if (!userIdentifier) {
      console.log('Usage: node src/scripts/debugUserPermissions.js <email_or_phone>');
      process.exit(1);
    }

    console.log('🔍 Debugging User Permissions...');
    console.log('=====================================\n');

    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find user
    const user = await User.findOne({
      $or: [
        { email: userIdentifier },
        { phone: userIdentifier }
      ]
    });

    if (!user) {
      console.log(`❌ User not found: ${userIdentifier}`);
      process.exit(1);
    }

    console.log(`👤 User Found:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Role (from user.role field): ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Verified: ${user.isVerified}\n`);

    // Check UserRole entries
    const userRoles = await UserRole.find({
      user: user._id,
      isActive: true
    }).populate('role', 'name displayName');

    console.log(`📋 UserRole Entries: ${userRoles.length}`);
    if (userRoles.length > 0) {
      userRoles.forEach((ur, idx) => {
        console.log(`   ${idx + 1}. Role: ${ur.role?.name || 'N/A'} (${ur.role?.displayName || 'N/A'})`);
        console.log(`      Primary: ${ur.isPrimary}`);
        console.log(`      Active: ${ur.isActive}`);
        console.log(`      Approved: ${ur.approvalStatus}`);
      });
    } else {
      console.log('   ⚠️  No UserRole entries found!');
    }
    console.log('');

    // Get role from database
    const role = await Role.findOne({ name: user.role }).populate('permissions', 'name displayName module');
    
    if (role) {
      console.log(`🔐 Role Details:`);
      console.log(`   Name: ${role.name}`);
      console.log(`   Display Name: ${role.displayName}`);
      console.log(`   Type: ${role.type}`);
      console.log(`   Active: ${role.isActive}`);
      console.log(`   Permissions Count: ${role.permissions.length}\n`);
      
      console.log(`📜 Permissions:`);
      const permNames = role.permissions.map(p => p.name);
      
      // Check for specific permissions
      const requiredPerms = [
        'finances.read.regional',
        'donors.read.regional',
        'users.read.regional',
        'applications.read.regional',
        'reports.read',
        'dashboard.read.regional'
      ];
      
      requiredPerms.forEach(permName => {
        const has = permNames.includes(permName);
        console.log(`   ${has ? '✅' : '❌'} ${permName}`);
      });
      
      console.log(`\n   All permissions (${role.permissions.length}):`);
      role.permissions.forEach(perm => {
        console.log(`      - ${perm.name} (${perm.module})`);
      });
    } else {
      console.log(`❌ Role '${user.role}' not found in database!`);
    }
    console.log('');

    // Test RBAC service
    console.log(`🧪 Testing RBAC Service:`);
    const testPermissions = [
      'finances.read.regional',
      'donors.read.regional',
      'users.read.regional',
      'applications.read.regional',
      'reports.read',
      'dashboard.read.regional'
    ];

    for (const permName of testPermissions) {
      try {
        const hasPerm = await rbacService.hasPermission(user._id, permName);
        console.log(`   ${hasPerm ? '✅' : '❌'} ${permName}: ${hasPerm}`);
      } catch (error) {
        console.log(`   ❌ ${permName}: Error - ${error.message}`);
      }
    }

    console.log('\n✅ Debug completed');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
debugUserPermissions();
