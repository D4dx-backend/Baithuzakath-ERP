const mongoose = require('mongoose');
const rbacService = require('../services/rbacService');
const { User } = require('../models');
const config = require('../config/environment');

/**
 * Initialize RBAC system with default roles and permissions
 * This script should be run after database setup
 */
async function initializeRBAC() {
  try {
    console.log('🚀 Starting RBAC initialization...');
    
    // Connect to database
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to database');

    // Initialize RBAC system
    await rbacService.initializeRBAC();
    
    // Create super admin user if it doesn't exist
    await createSuperAdminUser();
    
    console.log('🎉 RBAC initialization completed successfully!');
    
    // Display summary
    await displayRBACSummary();
    
  } catch (error) {
    console.error('❌ RBAC initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

/**
 * Create super admin user if it doesn't exist
 */
async function createSuperAdminUser() {
  try {
    const superAdminExists = await User.findOne({ role: 'super_admin' });
    
    if (!superAdminExists) {
      console.log('🔧 Creating super admin user...');
      
      const superAdmin = new User({
        name: 'Super Administrator',
        email: 'admin@baithuzzakath.org',
        phone: '9999999999',
        role: 'super_admin',
        adminScope: {
          level: 'super',
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
      console.log('✅ Super admin user created successfully');
      console.log('📧 Email: admin@baithuzzakath.org');
      console.log('📱 Phone: 9999999999');
      console.log('🔑 Use OTP login to access the system');
    } else {
      console.log('ℹ️  Super admin user already exists');
    }
  } catch (error) {
    console.error('❌ Failed to create super admin user:', error);
    throw error;
  }
}

/**
 * Display RBAC system summary
 */
async function displayRBACSummary() {
  try {
    const { Role, Permission, UserRole } = require('../models');
    
    const [
      totalRoles,
      systemRoles,
      customRoles,
      totalPermissions,
      totalUsers,
      superAdmins
    ] = await Promise.all([
      Role.countDocuments({ isActive: true }),
      Role.countDocuments({ type: 'system', isActive: true }),
      Role.countDocuments({ type: 'custom', isActive: true }),
      Permission.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'super_admin', isActive: true })
    ]);
    
    console.log('\n📊 RBAC System Summary:');
    console.log('========================');
    console.log(`👥 Total Active Roles: ${totalRoles}`);
    console.log(`🏛️  System Roles: ${systemRoles}`);
    console.log(`🔧 Custom Roles: ${customRoles}`);
    console.log(`🔐 Total Permissions: ${totalPermissions}`);
    console.log(`👤 Total Users: ${totalUsers}`);
    console.log(`👑 Super Admins: ${superAdmins}`);
    
    // Display role hierarchy
    console.log('\n🏗️  Role Hierarchy:');
    console.log('==================');
    const roles = await Role.find({ isActive: true }).sort({ level: 1 });
    roles.forEach(role => {
      console.log(`Level ${role.level}: ${role.displayName} (${role.name})`);
    });
    
    // Display permission modules
    console.log('\n📋 Permission Modules:');
    console.log('=====================');
    const permissionsByModule = await Permission.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$module', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    permissionsByModule.forEach(module => {
      console.log(`${module._id}: ${module.count} permissions`);
    });
    
  } catch (error) {
    console.error('❌ Failed to display RBAC summary:', error);
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeRBAC();
}

module.exports = { initializeRBAC, createSuperAdminUser, displayRBACSummary };