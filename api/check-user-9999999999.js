const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

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
  otp: {
    code: String,
    expiresAt: Date,
    attempts: Number,
    lastSentAt: Date,
    purpose: String,
    verified: Boolean
  },
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function checkUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const phone = '9999999999';
    console.log(`🔍 Searching for user with phone: ${phone}\n`);

    const user = await User.findOne({ phone });

    if (!user) {
      console.log('❌ User not found in database');
      console.log('\n📋 All state admin users:');
      const stateAdmins = await User.find({ role: 'state_admin' }).select('phone name email isActive');
      console.log(`Total state admins: ${stateAdmins.length}`);
      stateAdmins.forEach(u => {
        console.log(`  - ${u.phone} | ${u.name} | ${u.email} | Active: ${u.isActive}`);
      });
    } else {
      console.log('✅ User found in database!\n');
      console.log('📋 User Details:');
      console.log('================');
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Phone: ${user.phone}`);
      console.log(`Role: ${user.role}`);
      console.log(`Is Active: ${user.isActive}`);
      console.log(`Is Verified: ${user.isVerified}`);
      console.log(`Last Login: ${user.lastLogin || 'Never'}`);
      console.log(`Login Attempts: ${user.loginAttempts || 0}`);
      console.log(`Lock Until: ${user.lockUntil || 'Not locked'}`);
      console.log(`Created At: ${user.createdAt}`);
      console.log(`Updated At: ${user.updatedAt}`);
      
      console.log('\n🔐 Admin Scope:');
      console.log('================');
      if (user.adminScope) {
        console.log(`Level: ${user.adminScope.level}`);
        console.log(`Regions: ${user.adminScope.regions?.length || 0} region IDs`);
        console.log(`Projects: ${user.adminScope.projects?.length || 0} project IDs`);
        console.log(`Schemes: ${user.adminScope.schemes?.length || 0} scheme IDs`);
        console.log('\nPermissions:');
        if (user.adminScope.permissions) {
          Object.entries(user.adminScope.permissions).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        }
      } else {
        console.log('No admin scope defined');
      }

      console.log('\n📱 OTP Status:');
      console.log('================');
      if (user.otp && user.otp.code) {
        console.log(`Code: ${user.otp.code}`);
        console.log(`Expires At: ${user.otp.expiresAt}`);
        console.log(`Expired: ${user.otp.expiresAt < new Date()}`);
        console.log(`Attempts: ${user.otp.attempts}`);
        console.log(`Last Sent: ${user.otp.lastSentAt}`);
        console.log(`Purpose: ${user.otp.purpose}`);
        console.log(`Verified: ${user.otp.verified}`);
      } else {
        console.log('No active OTP');
      }

      // Check for issues
      console.log('\n⚠️  Potential Issues:');
      console.log('================');
      const issues = [];
      
      if (!user.isActive) {
        issues.push('❌ User account is NOT ACTIVE');
      }
      if (!user.isVerified) {
        issues.push('⚠️  User is NOT VERIFIED');
      }
      if (user.lockUntil && user.lockUntil > new Date()) {
        issues.push(`🔒 Account is LOCKED until ${user.lockUntil}`);
      }
      if (user.loginAttempts >= 5) {
        issues.push(`⚠️  Too many login attempts: ${user.loginAttempts}`);
      }
      if (!user.adminScope) {
        issues.push('⚠️  No admin scope defined');
      }
      if (user.role === 'state_admin' && user.adminScope?.level !== 'state') {
        issues.push(`⚠️  Role mismatch: role is ${user.role} but adminScope.level is ${user.adminScope?.level}`);
      }

      if (issues.length === 0) {
        console.log('✅ No issues found - user should be able to login');
      } else {
        issues.forEach(issue => console.log(issue));
      }

      // Test login
      console.log('\n🧪 Testing Login Flow:');
      console.log('================');
      console.log('Run these commands to test:');
      console.log(`\n1. Send OTP:`);
      console.log(`curl -X POST http://localhost:5001/api/auth/send-otp -H "Content-Type: application/json" -d '{"phone":"${phone}","purpose":"login"}'`);
      console.log(`\n2. Verify OTP (use the OTP from step 1):`);
      console.log(`curl -X POST http://localhost:5001/api/auth/verify-otp -H "Content-Type: application/json" -d '{"phone":"${phone}","otp":"123456","purpose":"login"}'`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkUser();
