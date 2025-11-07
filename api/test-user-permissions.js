const mongoose = require('mongoose');
const config = require('./src/config/environment');
const { User } = require('./src/models');
const rbacService = require('./src/services/rbacService');

async function testUserPermissions() {
  try {
    console.log('🔍 Testing user permissions...\n');

    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find state_admin user
    const user = await User.findOne({ role: 'state_admin' });
    if (!user) {
      console.log('❌ No state_admin user found');
      process.exit(1);
    }

    console.log(`👤 Testing permissions for: ${user.name} (${user.email})\n`);

    // Test specific permissions
    const permissionsToTest = [
      'permissions.read',
      'roles.read',
      'beneficiaries.read.all',
      'users.read.all'
    ];

    console.log('📋 Permission Check Results:');
    console.log('─'.repeat(60));

    for (const permName of permissionsToTest) {
      const hasPermission = await rbacService.hasPermission(user._id, permName);
      const status = hasPermission ? '✅' : '❌';
      console.log(`${status} ${permName.padEnd(30)} ${hasPermission ? 'GRANTED' : 'DENIED'}`);
    }

    console.log('─'.repeat(60));

    // Get all user permissions
    console.log('\n📦 Getting all user permissions...');
    const allPermissions = await rbacService.getUserPermissions(user._id);
    console.log(`\n✅ User has ${allPermissions.length} permissions total\n`);

    // Show first 10 permissions
    if (allPermissions.length > 0) {
      const Permission = require('./src/models/Permission');
      const permDocs = await Permission.find({ _id: { $in: allPermissions.slice(0, 10) } });
      console.log('First 10 permissions:');
      permDocs.forEach(p => {
        console.log(`  - ${p.name} (${p.displayName})`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error testing permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the test
testUserPermissions();
