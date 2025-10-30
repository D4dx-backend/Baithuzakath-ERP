const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
  isActive: Boolean,
  isVerified: Boolean,
  adminScope: {
    level: String,
    regions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    schemes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    permissions: {
      canCreateUsers: Boolean,
      canManageProjects: Boolean,
      canManageSchemes: Boolean,
      canApproveApplications: Boolean,
      canViewReports: Boolean,
      canManageFinances: Boolean
    }
  },
  profile: {
    avatar: String,
    dateOfBirth: Date,
    gender: String,
    address: {
      street: String,
      area: String,
      district: String,
      state: String,
      pincode: String
    }
  },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createStateAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const phone = '9656550933';
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      console.log('⚠️  User already exists with this phone number');
      console.log(`Name: ${existingUser.name}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`Active: ${existingUser.isActive}`);
      return;
    }

    console.log(`📝 Creating new state admin with phone: ${phone}\n`);

    // Create new state admin user
    const newUser = new User({
      name: 'State Administrator',
      email: 'stateadmin@baithuzzakath.org',
      phone: phone,
      role: 'state_admin',
      isActive: true,
      isVerified: true,
      adminScope: {
        level: 'state',
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
      profile: {
        gender: 'male',
        address: {
          state: 'Kerala',
          district: 'Thiruvananthapuram'
        }
      },
      loginAttempts: 0
    });

    await newUser.save();

    console.log('✅ State admin created successfully!\n');
    console.log('📋 User Details:');
    console.log('================');
    console.log(`ID: ${newUser._id}`);
    console.log(`Name: ${newUser.name}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Phone: ${newUser.phone}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`Is Active: ${newUser.isActive}`);
    console.log(`Is Verified: ${newUser.isVerified}`);
    console.log(`Admin Level: ${newUser.adminScope.level}`);
    
    console.log('\n✅ User can now login using OTP authentication');
    console.log(`📱 Phone: ${phone}`);
    console.log('🔐 Use the /api/auth/send-otp endpoint to receive OTP');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Duplicate key error - user with this phone or email already exists');
    }
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

createStateAdmin();
