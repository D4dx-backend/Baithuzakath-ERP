const mongoose = require('mongoose');
const { User } = require('./src/models');
require('dotenv').config();

async function fixUserPermissions() {
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

    console.log('🔧 Updating user permissions for state_admin...');
    
    // Update admin scope with proper permissions for state_admin
    user.adminScope = {
      level: 'state',
      regions: user.adminScope?.regions || [],
      projects: user.adminScope?.projects || [],
      schemes: user.adminScope?.schemes || [],
      permissions: {
        canApproveApplications: true,
        canCreateUsers: true,
        canManageFinances: true,
        canManageProjects: true,
        canManageSchemes: true,
        canViewReports: true
      }
    };
    
    await user.save();
    console.log('✅ User permissions updated successfully');

    // Display updated user details
    const updatedUser = await User.findOne({ phone: '9876543210' });
    console.log('\n📋 Updated User Details:');
    console.log('- Name:', updatedUser.name);
    console.log('- Role:', updatedUser.role);
    console.log('- Is Active:', updatedUser.isActive);
    console.log('- Is Verified:', updatedUser.isVerified);
    console.log('- Permissions:', JSON.stringify(updatedUser.adminScope.permissions, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixUserPermissions();