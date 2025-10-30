#!/usr/bin/env node

/**
 * Check if user has UserRole assignments (RBAC system)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Role, UserRole } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

async function checkUserRoleAssignments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the state admin user
    const user = await User.findOne({ phone: '9656550933' });
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('👤 User Details:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Role (old field): ${user.role}\n`);

    // Check for UserRole assignments (RBAC system)
    const userRoles = await UserRole.find({ user: user._id })
      .populate('role')
      .populate('assignedBy', 'name');

    console.log('🔐 UserRole Assignments (RBAC System):');
    console.log('======================================');
    
    if (userRoles.length === 0) {
      console.log('❌ NO UserRole assignments found!');
      console.log('\n⚠️  This is the problem!');
      console.log('   The user has a "role" field but no UserRole assignment.');
      console.log('   The RBAC system uses UserRole assignments to determine permissions.\n');
      console.log('💡 Solution: Create a UserRole assignment for this user.');
    } else {
      userRoles.forEach((ur, idx) => {
        console.log(`\n${idx + 1}. Role: ${ur.role.displayName} (${ur.role.name})`);
        console.log(`   Active: ${ur.isActive}`);
        console.log(`   Primary: ${ur.isPrimary}`);
        console.log(`   Assigned By: ${ur.assignedBy ? ur.assignedBy.name : 'System'}`);
        console.log(`   Valid From: ${ur.validFrom}`);
        console.log(`   Valid Until: ${ur.validUntil || 'No expiration'}`);
        console.log(`   Approval Status: ${ur.approvalStatus}`);
      });
    }

    // Check what the API would return
    console.log('\n\n🔍 Testing API Methods:');
    console.log('======================');
    
    try {
      const activeRoles = await UserRole.getUserActiveRoles(user._id);
      console.log(`getUserActiveRoles: ${activeRoles.length} active roles`);
      
      if (activeRoles.length > 0) {
        console.log('Active roles:');
        activeRoles.forEach(ur => {
          console.log(`  - ${ur.role.name}`);
        });
      }
    } catch (error) {
      console.log(`getUserActiveRoles ERROR: ${error.message}`);
    }

    // Check all users to see if any have UserRole assignments
    console.log('\n\n📊 All Users and Their UserRole Assignments:');
    console.log('============================================');
    
    const allUsers = await User.find({}).select('name email role');
    for (const u of allUsers) {
      const roleCount = await UserRole.countDocuments({ user: u._id });
      console.log(`${u.name} (${u.role}): ${roleCount} UserRole assignments`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

checkUserRoleAssignments().then(() => process.exit(0));
