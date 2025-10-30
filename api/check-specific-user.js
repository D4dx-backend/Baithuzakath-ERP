#!/usr/bin/env node

/**
 * Check specific user by phone number
 */

require('dotenv').config();
const mongoose = require('mongoose');
const rbacService = require('./src/services/rbacService');
const { User, Role, UserRole, Permission } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';
const PHONE = process.argv[2] || '9999999999';

async function checkSpecificUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the user
    const user = await User.findOne({ phone: PHONE });
    
    if (!user) {
      console.log(`❌ User with phone ${PHONE} NOT FOUND!`);
      console.log('\n📋 Available users:');
      const allUsers = await User.find({}).select('name email phone role');
      allUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.phone}) - Role: ${u.role}`);
      });
      return;
    }

    console.log('👤 User Found:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Role (old field): ${user.role}`);
    console.log(`   Active: ${user.isActive}\n`);

    // Check UserRole assignments
    const userRoles = await UserRole.find({ user: user._id })
      .populate('role');

    console.log('🔐 UserRole Assignments:');
    console.log('========================');
    
    if (userRoles.length === 0) {
      console.log('❌ NO UserRole assignments found!');
      console.log('\n⚠️  This user needs to be migrated to RBAC system.');
      console.log('   Creating UserRole assignment now...\n');
      
      // Find the role
      const role = await Role.findOne({ name: user.role });
      if (!role) {
        console.log(`❌ Role "${user.role}" not found in RBAC system!`);
        return;
      }

      // Create UserRole assignment
      const userRole = new UserRole({
        user: user._id,
        role: role._id,
        assignedBy: user._id,
        assignmentReason: 'Migration from old role system to RBAC',
        scope: {
          regions: user.adminScope?.regions || [],
          projects: user.adminScope?.projects || [],
          schemes: user.adminScope?.schemes || []
        },
        validFrom: user.createdAt || new Date(),
        validUntil: null,
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

      console.log(`✅ Created UserRole assignment: ${role.displayName}`);
      
      // Reload userRoles
      userRoles.push(await UserRole.findOne({ user: user._id }).populate('role'));
    } else {
      userRoles.forEach((ur, idx) => {
        console.log(`${idx + 1}. ${ur.role.displayName} (${ur.role.name})`);
        console.log(`   Active: ${ur.isActive}`);
        console.log(`   Primary: ${ur.isPrimary}`);
      });
    }

    // Test API permissions
    console.log('\n\n🔍 Testing API Permissions:');
    console.log('===========================');
    
    const permissionIds = await rbacService.getUserPermissions(user._id);
    const permissions = await Permission.find({
      _id: { $in: permissionIds }
    });

    console.log(`Total permissions: ${permissions.length}\n`);

    // Check for donor permissions
    const donorPerms = permissions.filter(p => 
      p.name.startsWith('donors.') || p.name.startsWith('donations.') || p.name === 'communications.send'
    );

    console.log('📋 Donor-Related Permissions:');
    if (donorPerms.length === 0) {
      console.log('❌ NO DONOR PERMISSIONS!');
    } else {
      donorPerms.forEach(p => {
        console.log(`   ✅ ${p.name}`);
      });
    }

    // Test specific permission
    console.log('\n\n🧪 Testing donors.read Permission:');
    console.log('===================================');
    
    const hasDonorsRead = await rbacService.hasPermission(user._id, 'donors.read');
    
    if (hasDonorsRead) {
      console.log('✅ User HAS donors.read permission');
      console.log('✅ User CAN access /donors page');
      console.log('\n💡 If still seeing "Access Denied":');
      console.log('   1. Clear browser cache and local storage');
      console.log('   2. Log out completely');
      console.log('   3. Log back in');
      console.log('   4. Try /donors page again');
    } else {
      console.log('❌ User DOES NOT have donors.read permission');
      console.log('❌ User CANNOT access /donors page');
      console.log('\n⚠️  The role may not have donor permissions assigned.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkSpecificUser().then(() => process.exit(0));
