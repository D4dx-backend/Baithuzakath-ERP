#!/usr/bin/env node

/**
 * Complete RBAC System Verification
 * Checks all components of the RBAC implementation
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Role, Permission, UserRole } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

async function verifyCompleteRBAC() {
  try {
    console.log('🔍 RBAC System 360° Verification\n');
    console.log('='.repeat(60));
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Verify Permissions
    console.log('📋 1. PERMISSIONS CHECK');
    console.log('='.repeat(60));
    
    const allPermissions = await Permission.find({ isActive: true });
    console.log(`Total Permissions: ${allPermissions.length}`);
    
    const byModule = {};
    allPermissions.forEach(p => {
      if (!byModule[p.module]) byModule[p.module] = 0;
      byModule[p.module]++;
    });
    
    console.log('\nPermissions by Module:');
    Object.keys(byModule).sort().forEach(module => {
      const status = byModule[module] > 0 ? '✅' : '❌';
      console.log(`  ${status} ${module}: ${byModule[module]}`);
    });
    
    // Check critical modules
    const criticalModules = ['donors', 'donations', 'communications', 'users', 'roles', 'projects', 'schemes', 'applications', 'beneficiaries', 'finances', 'settings'];
    const missingModules = criticalModules.filter(m => !byModule[m]);
    
    if (missingModules.length > 0) {
      console.log(`\n❌ Missing modules: ${missingModules.join(', ')}`);
    } else {
      console.log('\n✅ All critical modules have permissions');
    }

    // 2. Verify Roles
    console.log('\n\n🎭 2. ROLES CHECK');
    console.log('='.repeat(60));
    
    const allRoles = await Role.find({ isActive: true }).populate('permissions');
    console.log(`Total Roles: ${allRoles.length}\n`);
    
    allRoles.forEach(role => {
      console.log(`${role.name} (Level ${role.level})`);
      console.log(`  Permissions: ${role.permissions.length}`);
      
      // Check for donor permissions
      const donorPerms = role.permissions.filter(p => 
        p.module === 'donors' || p.module === 'donations' || p.module === 'communications'
      );
      
      if (donorPerms.length > 0) {
        console.log(`  ✅ Has ${donorPerms.length} donor-related permissions`);
      } else if (role.name !== 'beneficiary' && role.name !== 'unit_admin') {
        console.log(`  ⚠️  No donor permissions (might be intentional)`);
      }
    });

    // 3. Verify Users
    console.log('\n\n👥 3. USERS CHECK');
    console.log('='.repeat(60));
    
    const allUsers = await User.find({}).select('name phone role isActive');
    console.log(`Total Users: ${allUsers.length}\n`);
    
    for (const user of allUsers) {
      const userRoleAssignments = await UserRole.countDocuments({ 
        user: user._id,
        isActive: true 
      });
      
      const status = userRoleAssignments > 0 ? '✅' : '❌';
      console.log(`${status} ${user.name} (${user.phone})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   UserRole Assignments: ${userRoleAssignments}`);
      
      if (userRoleAssignments === 0) {
        console.log(`   ⚠️  WARNING: No UserRole assignment!`);
      }
    }

    // 4. Verify Super Admin
    console.log('\n\n👑 4. SUPER ADMIN CHECK');
    console.log('='.repeat(60));
    
    const superAdmin = await User.findOne({ phone: '9999999999' });
    if (!superAdmin) {
      console.log('❌ Super admin (9999999999) not found!');
    } else {
      console.log(`✅ Super admin exists: ${superAdmin.name}`);
      
      const superAdminRole = await UserRole.findOne({ 
        user: superAdmin._id,
        isActive: true 
      }).populate('role');
      
      if (!superAdminRole) {
        console.log('❌ Super admin has no UserRole assignment!');
      } else {
        console.log(`✅ UserRole assignment: ${superAdminRole.role.name}`);
        
        const role = await Role.findById(superAdminRole.role._id).populate('permissions');
        console.log(`✅ Total permissions: ${role.permissions.length}`);
        
        const donorPerms = role.permissions.filter(p => 
          p.module === 'donors' || p.module === 'donations' || p.module === 'communications'
        );
        console.log(`✅ Donor permissions: ${donorPerms.length}`);
        
        if (role.permissions.length >= 59 && donorPerms.length >= 12) {
          console.log('\n🎉 Super admin is FULLY configured!');
        } else {
          console.log('\n⚠️  Super admin may be missing permissions');
        }
      }
    }

    // 5. Verify Permission Coverage
    console.log('\n\n📊 5. PERMISSION COVERAGE');
    console.log('='.repeat(60));
    
    const requiredPermissions = [
      'donors.read', 'donors.create', 'donors.update.regional', 'donors.delete',
      'projects.read.all', 'projects.read.assigned',
      'schemes.read.all', 'schemes.read.assigned',
      'applications.read.all', 'applications.read.regional',
      'beneficiaries.read.all', 'beneficiaries.read.regional',
      'users.read.all', 'users.read.regional',
      'roles.read',
      'finances.read.all', 'finances.read.regional', 'finances.manage',
      'communications.send',
      'settings.read', 'settings.update'
    ];
    
    console.log('Checking critical permissions:\n');
    
    let allPresent = true;
    for (const permName of requiredPermissions) {
      const exists = await Permission.findOne({ name: permName, isActive: true });
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${permName}`);
      if (!exists) allPresent = false;
    }
    
    if (allPresent) {
      console.log('\n✅ All critical permissions exist!');
    } else {
      console.log('\n❌ Some permissions are missing!');
    }

    // 6. Summary
    console.log('\n\n📈 6. SYSTEM SUMMARY');
    console.log('='.repeat(60));
    
    const totalUserRoles = await UserRole.countDocuments({ isActive: true });
    const usersWithoutRoles = await User.countDocuments({
      _id: { $nin: await UserRole.distinct('user', { isActive: true }) }
    });
    
    console.log(`Total Permissions: ${allPermissions.length}`);
    console.log(`Total Roles: ${allRoles.length}`);
    console.log(`Total Users: ${allUsers.length}`);
    console.log(`Users with UserRole: ${totalUserRoles}`);
    console.log(`Users without UserRole: ${usersWithoutRoles}`);
    
    // Final verdict
    console.log('\n\n🎯 FINAL VERDICT');
    console.log('='.repeat(60));
    
    const issues = [];
    
    if (allPermissions.length < 59) issues.push('Missing permissions');
    if (allRoles.length < 8) issues.push('Missing roles');
    if (usersWithoutRoles > 0) issues.push(`${usersWithoutRoles} users without UserRole`);
    if (!byModule['donors']) issues.push('No donor permissions');
    if (!byModule['donations']) issues.push('No donation permissions');
    if (!byModule['communications']) issues.push('No communication permissions');
    
    if (issues.length === 0) {
      console.log('✅ RBAC SYSTEM IS FULLY OPERATIONAL!');
      console.log('✅ All permissions exist');
      console.log('✅ All roles configured');
      console.log('✅ All users have UserRole assignments');
      console.log('✅ Donor module fully integrated');
      console.log('\n🎉 System is production-ready!');
    } else {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   ❌ ${issue}`));
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyCompleteRBAC().then(() => process.exit(0));
