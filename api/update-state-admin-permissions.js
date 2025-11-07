const mongoose = require('mongoose');
require('dotenv').config();

const Role = require('./src/models/Role');
const Permission = require('./src/models/Permission');

async function updateStateAdminPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find state_admin role
    const stateAdminRole = await Role.findOne({ name: 'state_admin' });
    
    if (!stateAdminRole) {
      console.log('❌ state_admin role not found');
      return;
    }

    console.log('📝 Current permissions count:', stateAdminRole.permissions.length);

    // Define all required permissions for state_admin
    const requiredPermissions = [
      // User Management - Full Access
      'users.create', 'users.read.all', 'users.read.regional', 'users.read.own',
      'users.update.all', 'users.update.regional', 'users.update.own', 'users.delete',
      
      // Role and Permission Management
      'roles.create', 'roles.read', 'roles.update', 'roles.delete', 'roles.assign',
      'permissions.read', 'permissions.manage',
      
      // Beneficiary Management - Full Access
      'beneficiaries.create', 'beneficiaries.read.all', 'beneficiaries.read.regional', 'beneficiaries.read.own',
      'beneficiaries.update.regional', 'beneficiaries.update.own',
      
      // Application Management - Full Access
      'applications.create', 'applications.read.all', 'applications.read.regional', 'applications.read.own',
      'applications.update.regional', 'applications.approve',
      
      // Project Management - Full Access
      'projects.create', 'projects.read.all', 'projects.read.assigned',
      'projects.update.all', 'projects.update.assigned', 'projects.manage',
      
      // Scheme Management - Full Access
      'schemes.create', 'schemes.read.all', 'schemes.read.assigned',
      'schemes.update.assigned', 'schemes.manage',
      
      // Reports and Analytics - Full Access
      'reports.read', 'reports.create', 'reports.update', 'reports.delete',
      'reports.read.all', 'reports.read.regional', 'reports.export',
      
      // Financial Management - Full Access
      'finances.read.all', 'finances.read.regional', 'finances.manage',
      
      // Donor Management - Full Access
      'donors.create', 'donors.read', 'donors.read.all', 'donors.read.regional',
      'donors.update.regional', 'donors.delete', 'donors.verify',
      
      // Donation Management - Full Access
      'donations.create', 'donations.read.all', 'donations.read.regional', 'donations.update.regional',
      
      // Communication Management
      'communications.send',
      
      // System Administration
      'settings.read', 'settings.update',
      'audit.read',
      
      // Form Builder - Full Access
      'forms.create', 'forms.read', 'forms.update', 'forms.delete', 'forms.manage',
      
      // Location Management - Full Access
      'locations.create', 'locations.read', 'locations.update', 'locations.delete',
      
      // Dashboard Access
      'dashboard.read.all', 'dashboard.read.regional',
      
      // System Monitoring
      'system.debug', 'system.monitor',
      
      // Document Management - Full Access
      'documents.create', 'documents.read.all', 'documents.read.regional',
      'documents.update', 'documents.delete',
      
      // Interview Management - Full Access
      'interviews.schedule', 'interviews.read', 'interviews.update', 'interviews.cancel'
    ];

    // Get permission IDs
    const permissions = await Permission.find({ name: { $in: requiredPermissions } });
    const permissionIds = permissions.map(p => p._id);

    console.log('📝 Found permissions in DB:', permissions.length);
    console.log('📝 Required permissions:', requiredPermissions.length);

    // Update the role
    stateAdminRole.permissions = permissionIds;
    await stateAdminRole.save();

    console.log('✅ Updated state_admin role permissions');
    console.log('📝 New permissions count:', stateAdminRole.permissions.length);

    // Verify critical permissions
    const criticalPermissions = [
      'applications.read.regional',
      'finances.read.regional',
      'donors.read.regional',
      'users.read.regional',
      'beneficiaries.read.regional'
    ];

    const criticalPerms = await Permission.find({ name: { $in: criticalPermissions } });
    const hasCritical = criticalPerms.every(p => 
      stateAdminRole.permissions.some(pid => pid.toString() === p._id.toString())
    );

    if (hasCritical) {
      console.log('✅ All critical permissions verified');
    } else {
      console.log('⚠️  Some critical permissions missing');
    }

    console.log('\n✅ State Admin permissions updated successfully');
    console.log('\nYou can now login with:');
    console.log('Phone: 9876543210');
    console.log('OTP: 123456');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateStateAdminPermissions();
