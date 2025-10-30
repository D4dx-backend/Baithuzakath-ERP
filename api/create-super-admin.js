#!/usr/bin/env node

/**
 * Create super admin user with proper RBAC setup
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Role, UserRole } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ phone: '9999999999' });
    
    if (existingSuperAdmin) {
      console.log('ℹ️  Super admin user already exists');
      console.log(`   Name: ${existingSuperAdmin.name}`);
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Phone: ${existingSuperAdmin.phone}\n`);
      
      // Check if has UserRole assignment
      const userRole = await UserRole.findOne({ user: existingSuperAdmin._id });
      if (!userRole) {
        console.log('⚠️  Super admin exists but has no UserRole assignment');
        console.log('   Creating UserRole assignment...\n');
        await createUserRoleAssignment(existingSuperAdmin);
      } else {
        console.log('✅ Super admin has UserRole assignment');
      }
      return;
    }

    console.log('🔧 Creating super admin user...\n');

    // Create super admin user
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'superadmin@baithuzzakath.org',
      phone: '9999999999',
      role: 'super_admin',
      adminScope: {
        level: 'super',
        regions: [],
        projects: [],
        schemes: [],
        permissions: {
          canCreateUsers: true,
          canManageProjects: true,
          canManageSchemes: true,
          canApproveApplications: true,
          canViewReports: true,
          canManageFinances: true
        }
      },
      isVerified: true,
      isActive: true
    });

    await superAdmin.save();
    console.log('✅ Super admin user created');
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Phone: ${superAdmin.phone}\n`);

    // Create UserRole assignment
    await createUserRoleAssignment(superAdmin);

    console.log('\n✨ Super admin setup complete!');
    console.log('\n📱 Login credentials:');
    console.log('   Phone: 9999999999');
    console.log('   Use OTP login\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function createUserRoleAssignment(user) {
  // Find super_admin role
  const superAdminRole = await Role.findOne({ name: 'super_admin' });
  if (!superAdminRole) {
    console.log('❌ super_admin role not found in RBAC system!');
    return;
  }

  // Create UserRole assignment
  const userRole = new UserRole({
    user: user._id,
    role: superAdminRole._id,
    assignedBy: user._id,
    assignmentReason: 'Initial super admin setup',
    scope: {
      regions: [],
      projects: [],
      schemes: []
    },
    validFrom: new Date(),
    validUntil: null,
    isPrimary: true,
    isTemporary: false,
    approvalStatus: 'approved',
    isActive: true
  });

  await userRole.save();

  // Update role statistics
  await Role.findByIdAndUpdate(superAdminRole._id, {
    $inc: { 
      'stats.totalUsers': 1,
      'stats.activeUsers': 1
    },
    'stats.lastAssigned': new Date()
  });

  console.log('✅ UserRole assignment created');
  console.log(`   Role: ${superAdminRole.displayName}`);
  console.log(`   Permissions: ALL (${superAdminRole.permissions.length} total)`);
}

createSuperAdmin().then(() => process.exit(0));
