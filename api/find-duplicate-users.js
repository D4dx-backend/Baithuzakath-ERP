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
  adminScope: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function findDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const phone = '9656550933';
    console.log(`🔍 Finding all users with phone: ${phone}\n`);

    const users = await User.find({ phone }).sort({ createdAt: 1 });

    console.log(`Found ${users.length} user(s) with this phone number:\n`);

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log('================');
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Active: ${user.isActive}`);
      console.log(`Verified: ${user.isVerified}`);
      console.log(`Admin Level: ${user.adminScope?.level || 'N/A'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`Updated: ${user.updatedAt}`);
      console.log('');
    });

    if (users.length > 1) {
      console.log('⚠️  DUPLICATE USERS FOUND!');
      console.log('\n🔧 Recommended Action:');
      console.log('Delete the beneficiary user and keep the state_admin:');
      
      const beneficiaryUser = users.find(u => u.role === 'beneficiary');
      const stateAdminUser = users.find(u => u.role === 'state_admin');
      
      if (beneficiaryUser && stateAdminUser) {
        console.log(`\nDelete beneficiary: ${beneficiaryUser._id}`);
        console.log(`Keep state_admin: ${stateAdminUser._id}`);
        console.log('\nRun this command:');
        console.log(`User.findByIdAndDelete('${beneficiaryUser._id}')`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

findDuplicates();
