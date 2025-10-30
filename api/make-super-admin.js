const mongoose = require('mongoose');
const { User } = require('./src/models');
require('dotenv').config();

async function makeSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath');
    console.log('✅ Connected to MongoDB');

    // Find user with phone 9876543210
    const user = await User.findOne({ phone: '9876543210' });
    
    if (!user) {
      console.log('❌ User with phone 9876543210 not found');
      return;
    }

    console.log('📋 Current User Details:');
    console.log('- Name:', user.name);
    console.log('- Phone:', user.phone);
    console.log('- Current Role:', user.role);

    console.log('\n🔧 Updating user to super_admin with full access...');
    
    // Update user to super_admin with full permissions
    user.role = 'super_admin';
    user.isActive = true;
    user.isVerified = true;
    
    // Set admin scope for super admin (full access)
    user.adminScope = {
      level: 'super',
      regions: [], // Empty means access to all regions
      projects: [], // Empty means access to all projects
      schemes: [], // Empty means access to all schemes
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
    console.log('✅ User updated to super_admin successfully');

    // Display updated user details
    const updatedUser = await User.findOne({ phone: '9876543210' });
    console.log('\n📋 Updated User Details:');
    console.log('- Name:', updatedUser.name);
    console.log('- Role:', updatedUser.role);
    console.log('- Is Active:', updatedUser.isActive);
    console.log('- Is Verified:', updatedUser.isVerified);
    console.log('- Admin Level:', updatedUser.adminScope.level);
    console.log('- Regions Access:', updatedUser.adminScope.regions.length === 0 ? 'ALL REGIONS' : updatedUser.adminScope.regions);
    console.log('- Projects Access:', updatedUser.adminScope.projects.length === 0 ? 'ALL PROJECTS' : updatedUser.adminScope.projects);
    console.log('- Schemes Access:', updatedUser.adminScope.schemes.length === 0 ? 'ALL SCHEMES' : updatedUser.adminScope.schemes);
    console.log('- Permissions:', JSON.stringify(updatedUser.adminScope.permissions, null, 2));

    console.log('\n🎉 Super Admin Access Granted!');
    console.log('This user now has:');
    console.log('✅ Access to ALL regions, projects, and schemes');
    console.log('✅ Full administrative permissions');
    console.log('✅ Can approve applications');
    console.log('✅ Can manage users, projects, schemes');
    console.log('✅ Can view all reports and manage finances');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

makeSuperAdmin();