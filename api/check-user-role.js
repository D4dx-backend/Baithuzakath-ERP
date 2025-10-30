const mongoose = require('mongoose');
const { User } = require('./src/models');
require('dotenv').config();

async function checkAndUpdateUserRole() {
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
    console.log('- ID:', user._id);
    console.log('- Name:', user.name);
    console.log('- Phone:', user.phone);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Is Active:', user.isActive);
    console.log('- Is Verified:', user.isVerified);
    console.log('- Admin Scope:', JSON.stringify(user.adminScope, null, 2));

    // Check if role is correct
    const expectedRoles = ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'];
    
    if (!expectedRoles.includes(user.role)) {
      console.log('⚠️  User role is not in expected admin roles');
      console.log('🔧 Updating user role to state_admin...');
      
      user.role = 'state_admin';
      user.isActive = true;
      user.isVerified = true;
      
      // Set admin scope for state admin
      user.adminScope = {
        level: 'state',
        regions: [],
        projects: [],
        schemes: []
      };
      
      await user.save();
      console.log('✅ User role updated successfully');
    } else {
      console.log('✅ User role is correct');
      
      // Ensure user is active and verified
      if (!user.isActive || !user.isVerified) {
        console.log('🔧 Activating and verifying user...');
        user.isActive = true;
        user.isVerified = true;
        await user.save();
        console.log('✅ User activated and verified');
      }
    }

    // Display final user details
    const updatedUser = await User.findOne({ phone: '9876543210' });
    console.log('\n📋 Updated User Details:');
    console.log('- Role:', updatedUser.role);
    console.log('- Is Active:', updatedUser.isActive);
    console.log('- Is Verified:', updatedUser.isVerified);
    console.log('- Admin Scope:', JSON.stringify(updatedUser.adminScope, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkAndUpdateUserRole();