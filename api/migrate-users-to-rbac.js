#!/usr/bin/env node

/**
 * Migration script to create UserRole assignments for existing users
 * This bridges the old "role" field with the new RBAC system
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Role, UserRole } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

async function migrateUsersToRBAC() {
  try {
    console.log('🚀 Starting user migration to RBAC system...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('_id name email phone role isActive');
    console.log(`📊 Found ${users.length} users to migrate\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Check if user already has a UserRole assignment
        const existingAssignment = await UserRole.findOne({ 
          user: user._id,
          isActive: true 
        });

        if (existingAssignment) {
          console.log(`⏭️  ${user.name} - Already has UserRole assignment, skipping`);
          skipped++;
          continue;
        }

        // Find the role
        const role = await Role.findOne({ name: user.role });
        if (!role) {
          console.log(`❌ ${user.name} - Role "${user.role}" not found in RBAC system`);
          errors++;
          continue;
        }

        // Create UserRole assignment
        const userRole = new UserRole({
          user: user._id,
          role: role._id,
          assignedBy: user._id, // Self-assigned during migration
          assignmentReason: 'Migration from old role system to RBAC',
          scope: {
            regions: user.adminScope?.regions || [],
            projects: user.adminScope?.projects || [],
            schemes: user.adminScope?.schemes || []
          },
          validFrom: user.createdAt || new Date(),
          validUntil: null, // No expiration
          isPrimary: true,
          isTemporary: false,
          approvalStatus: 'approved',
          isActive: user.isActive
        });

        await userRole.save();

        // Update role statistics
        await Role.findByIdAndUpdate(role._id, {
          $inc: { 
            'stats.totalUsers': 1,
            'stats.activeUsers': user.isActive ? 1 : 0
          },
          'stats.lastAssigned': new Date()
        });

        console.log(`✅ ${user.name} - Migrated to ${role.displayName}`);
        migrated++;

      } catch (error) {
        console.log(`❌ ${user.name} - Error: ${error.message}`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${migrated} users`);
    console.log(`⏭️  Skipped (already migrated): ${skipped} users`);
    console.log(`❌ Errors: ${errors} users`);
    console.log(`📈 Total processed: ${users.length} users`);
    console.log('='.repeat(60));

    // Verify migration
    console.log('\n🔍 Verification:');
    console.log('================');
    
    const totalUserRoles = await UserRole.countDocuments({});
    const activeUserRoles = await UserRole.countDocuments({ isActive: true });
    
    console.log(`Total UserRole assignments: ${totalUserRoles}`);
    console.log(`Active UserRole assignments: ${activeUserRoles}`);

    // Check specific user
    const testUser = await User.findOne({ phone: '9656550933' });
    if (testUser) {
      const testUserRoles = await UserRole.find({ user: testUser._id })
        .populate('role', 'name displayName');
      
      console.log(`\n✅ Test User (${testUser.name}):`);
      console.log(`   UserRole assignments: ${testUserRoles.length}`);
      if (testUserRoles.length > 0) {
        testUserRoles.forEach(ur => {
          console.log(`   - ${ur.role.displayName} (${ur.isActive ? 'Active' : 'Inactive'})`);
        });
      }
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart the backend API server');
    console.log('   2. Users should log out and log back in');
    console.log('   3. Test the /donors page access\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateUsersToRBAC()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
