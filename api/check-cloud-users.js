const mongoose = require('mongoose');
require('dotenv').config();

// Use the MongoDB URI from .env (cloud database)
const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
  isActive: Boolean,
  isVerified: Boolean,
  adminScope: {
    level: String,
    regions: [{ type: mongoose.Schema.Types.ObjectId }],
    projects: [{ type: mongoose.Schema.Types.ObjectId }],
    schemes: [{ type: mongoose.Schema.Types.ObjectId }],
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

async function checkUsers() {
  try {
    console.log('🔌 Connecting to MongoDB Cloud...');
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all users
    console.log('📋 All Users in Database:');
    console.log('================\n');
    const allUsers = await User.find({}).select('phone name email role isActive isVerified adminScope.level').sort({ role: 1, name: 1 });
    
    console.log(`Total users: ${allUsers.length}\n`);
    
    const usersByRole = {};
    allUsers.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    Object.entries(usersByRole).forEach(([role, users]) => {
      console.log(`\n${role.toUpperCase()} (${users.length}):`);
      console.log('─'.repeat(60));
      users.forEach(user => {
        const status = user.isActive ? '✅' : '❌';
        const verified = user.isVerified ? '✓' : '✗';
        console.log(`${status} ${user.phone} | ${user.name}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Active: ${user.isActive} | Verified: ${user.isVerified} | Level: ${user.adminScope?.level || 'N/A'}`);
        console.log('');
      });
    });

    // Check specific phones
    console.log('\n🔍 Checking Specific Phone Numbers:');
    console.log('================\n');
    
    const phonesToCheck = ['9999999999', '9656550933', '9876543210'];
    
    for (const phone of phonesToCheck) {
      const user = await User.findOne({ phone });
      if (user) {
        console.log(`✅ ${phone}: ${user.name} (${user.role}) - Active: ${user.isActive}`);
      } else {
        console.log(`❌ ${phone}: Not found`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('authentication')) {
      console.error('\n⚠️  Database authentication failed. Check your MONGODB_URI credentials.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkUsers();
