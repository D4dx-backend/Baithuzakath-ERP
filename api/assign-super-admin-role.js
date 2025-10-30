const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// Import models
const User = require('./src/models/User');
const Role = require('./src/models/Role');
const UserRole = require('./src/models/UserRole');
const Permission = require('./src/models/Permission');

async function assignSuperAdminRole() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const phone = '9999999999';
    
    // Find the user
    console.log(`🔍 Finding user with phone: ${phone}`);
    const user = await User.findOne({ phone });
    
    if (!user) {
      console.log('❌ User not found!');
      console.log('Creating super admin user...');
      
      // Create super admin user
      const newUser = new User({
        name: 'Super Administrator',
        email: 'admin@baithuzzakath.org',
        phone: phone,
        role: 'super_admin',
        isActive: true,
        isVerified: true,
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
        }
      });
      
      await newUser.save();
      console.log('✅ Super admin user created');
      user = newUser;
    } else {
      console.log('✅ User found:', user.name);
      
      // Update user role if needed
      if (user.role !== 'super_admin') {
        console.log(`📝 Updating user role from ${user.role} to super_admin`);
        user.role = 'super_admin';
        user.adminScope = {
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
        };
        await user.save();
        console.log('✅ User role updated');
      }
    }

    // Find super_admin role
    console.log('\n🔍 Finding super_admin role...');
    let superAdminRole = await Role.findOne({ name: 'super_admin' });
    
    if (!superAdminRole) {
      console.log('❌ Super admin role not found!');
      console.log('📝 Creating super_admin role...');
      
      // Get all permissions
      const allPermissions = await Permission.find({ isActive: true });
      console.log(`Found ${allPermissions.length} permissions`);
      
      superAdminRole = new Role({
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        type: 'system',
        level: 0,
        category: 'admin',
        scopeConfig: {
          allowedScopeLevels: ['super', 'state', 'district', 'area', 'unit'],
          defaultScopeLevel: 'super',
          allowMultipleScopes: false,
          maxScopes: 1
        },
        constraints: {
          maxUsers: 5,
          requiresApproval: true,
          isDeletable: false,
          isModifiable: false
        },
        isDefault: false,
        permissions: allPermissions.map(p => p._id)
      });
      
      await superAdminRole.save();
      console.log('✅ Super admin role created with all permissions');
    } else {
      console.log('✅ Super admin role found');
      
      // Ensure super_admin role has all permissions
      const allPermissions = await Permission.find({ isActive: true });
      const currentPermissionIds = superAdminRole.permissions.map(p => p.toString());
      const allPermissionIds = allPermissions.map(p => p._id.toString());
      
      const missingPermissions = allPermissionIds.filter(id => !currentPermissionIds.includes(id));
      
      if (missingPermissions.length > 0) {
        console.log(`📝 Adding ${missingPermissions.length} missing permissions to super_admin role`);
        superAdminRole.permissions = allPermissions.map(p => p._id);
        await superAdminRole.save();
        console.log('✅ Super admin role updated with all permissions');
      } else {
        console.log('✅ Super admin role already has all permissions');
      }
    }

    // Check if user already has super_admin role assigned
    console.log('\n🔍 Checking role assignment...');
    let userRole = await UserRole.findOne({
      user: user._id,
      role: superAdminRole._id,
      isActive: true
    });

    if (!userRole) {
      console.log('📝 Assigning super_admin role to user...');
      
      userRole = new UserRole({
        user: user._id,
        role: superAdminRole._id,
        assignedBy: user._id, // Self-assigned for initial setup
        assignmentReason: 'Initial super admin setup',
        scope: {
          level: 'super',
          regions: [],
          projects: [],
          schemes: []
        },
        validFrom: new Date(),
        validUntil: null, // No expiration
        isPrimary: true,
        isTemporary: false,
        approvalStatus: 'approved',
        isActive: true
      });
      
      await userRole.save();
      console.log('✅ Super admin role assigned to user');
    } else {
      console.log('✅ User already has super_admin role assigned');
      
      // Ensure it's active and approved
      if (!userRole.isActive || userRole.approvalStatus !== 'approved') {
        console.log('📝 Activating and approving role assignment...');
        userRole.isActive = true;
        userRole.approvalStatus = 'approved';
        await userRole.save();
        console.log('✅ Role assignment activated');
      }
    }

    // Verify permissions
    console.log('\n🔍 Verifying user permissions...');
    const userRoles = await UserRole.find({
      user: user._id,
      isActive: true
    }).populate('role');
    
    let totalPermissions = 0;
    for (const ur of userRoles) {
      if (ur.role) {
        totalPermissions += ur.role.permissions.length;
      }
    }
    
    console.log(`✅ User has ${totalPermissions} permissions from ${userRoles.length} role(s)`);

    // Summary
    console.log('\n📋 Summary:');
    console.log('================');
    console.log(`User ID: ${user._id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Verified: ${user.isVerified}`);
    console.log(`Admin Level: ${user.adminScope?.level}`);
    console.log(`Total Permissions: ${totalPermissions}`);
    console.log(`Role Assignments: ${userRoles.length}`);
    
    console.log('\n✅ Super admin setup complete!');
    console.log('\n🔐 Login Credentials:');
    console.log(`Phone: ${phone}`);
    console.log('OTP: 123456 (development mode)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

assignSuperAdminRole();
