const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Role = require('./src/models/Role');

async function fixStateAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the state admin user
    const stateAdmin = await User.findOne({ phone: '9876543210' });
    
    if (!stateAdmin) {
      console.log('❌ State Admin user not found. Creating...');
      
      // Find Kerala state location
      const Location = require('./src/models/Location');
      const kerala = await Location.findOne({ name: 'Kerala', type: 'state' });
      
      const newStateAdmin = new User({
        name: 'State Administrator',
        email: 'admin@baithuzzakath.org',
        phone: '9876543210',
        password: 'Admin@123',
        role: 'state_admin',
        adminScope: {
          level: 'state',
          regions: kerala ? [kerala._id] : []
        },
        profile: {
          gender: 'male',
          address: {
            street: 'Secretariat',
            area: 'Thiruvananthapuram',
            district: 'Thiruvananthapuram',
            state: 'Kerala',
            pincode: '695001'
          }
        },
        isActive: true,
        isVerified: true
      });
      
      await newStateAdmin.save();
      console.log('✅ State Admin user created');
    } else {
      console.log('✅ State Admin user found');
      console.log('Current role:', stateAdmin.role);
      console.log('Admin scope:', stateAdmin.adminScope);
      
      // Update role if needed
      if (stateAdmin.role !== 'state_admin') {
        stateAdmin.role = 'state_admin';
        await stateAdmin.save();
        console.log('✅ Updated role to state_admin');
      }
      
      // Ensure user is active and verified
      if (!stateAdmin.isActive || !stateAdmin.isVerified) {
        stateAdmin.isActive = true;
        stateAdmin.isVerified = true;
        await stateAdmin.save();
        console.log('✅ Activated and verified user');
      }
    }

    // Check if state_admin role exists
    const stateAdminRole = await Role.findOne({ name: 'state_admin' });
    
    if (!stateAdminRole) {
      console.log('❌ state_admin role not found in database');
      console.log('⚠️  You need to run: npm run seed');
    } else {
      console.log('✅ state_admin role exists');
      console.log('Permissions count:', stateAdminRole.permissions.length);
      
      // Check for required permissions
      const Permission = require('./src/models/Permission');
      const requiredPermissionNames = [
        'applications.read.regional',
        'finances.read.regional',
        'donors.read.regional',
        'users.read.regional',
        'beneficiaries.read.regional'
      ];
      
      const requiredPerms = await Permission.find({ name: { $in: requiredPermissionNames } });
      const requiredPermIds = requiredPerms.map(p => p._id.toString());
      const rolePermIds = stateAdminRole.permissions.map(p => p.toString());
      
      const missingPerms = requiredPerms.filter(
        perm => !rolePermIds.includes(perm._id.toString())
      );
      
      if (missingPerms.length > 0) {
        console.log('❌ Missing permissions:', missingPerms.map(p => p.name));
        console.log('⚠️  Run: node update-state-admin-permissions.js');
      } else {
        console.log('✅ All required permissions present');
      }
    }

    console.log('\n✅ State Admin check complete');
    console.log('\nLogin credentials:');
    console.log('Phone: 9876543210');
    console.log('OTP: 123456');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixStateAdmin();
