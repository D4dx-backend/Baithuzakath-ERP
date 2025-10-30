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

async function checkUserById() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userId = '68f66a2447579ede7a86153a';
    console.log(`🔍 Checking user with ID: ${userId}\n`);

    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ User not found with this ID');
    } else {
      console.log('✅ User found!\n');
      console.log('📋 User Details:');
      console.log('================');
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Phone: ${user.phone}`);
      console.log(`Role: ${user.role}`);
      console.log(`Active: ${user.isActive}`);
      console.log(`Verified: ${user.isVerified}`);
      console.log(`Admin Level: ${user.adminScope?.level || 'N/A'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`Updated: ${user.updatedAt}`);
    }

    // Also check our state admin
    console.log('\n\n🔍 Checking our state admin user...\n');
    const stateAdmin = await User.findById('69004a8b94e5a282d94a6fcc');
    
    if (stateAdmin) {
      console.log('✅ State admin found!\n');
      console.log('📋 State Admin Details:');
      console.log('================');
      console.log(`ID: ${stateAdmin._id}`);
      console.log(`Name: ${stateAdmin.name}`);
      console.log(`Email: ${stateAdmin.email}`);
      console.log(`Phone: ${stateAdmin.phone}`);
      console.log(`Role: ${stateAdmin.role}`);
      console.log(`Active: ${stateAdmin.isActive}`);
      console.log(`Verified: ${stateAdmin.isVerified}`);
      console.log(`Admin Level: ${stateAdmin.adminScope?.level || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkUserById();
