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
  otp: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function deleteBeneficiary() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const phone = '9656550933';
    
    // Find all users with this phone
    const users = await User.find({ phone });
    console.log(`Found ${users.length} user(s) with phone ${phone}\n`);

    // Delete beneficiary users, keep state_admin
    for (const user of users) {
      console.log(`User: ${user.name} (${user.role}) - ID: ${user._id}`);
      
      if (user.role === 'beneficiary') {
        console.log(`  ❌ Deleting beneficiary user...`);
        await User.findByIdAndDelete(user._id);
        console.log(`  ✅ Deleted!`);
      } else if (user.role === 'state_admin') {
        console.log(`  ✅ Keeping state_admin user`);
      }
    }

    console.log('\n📋 Remaining users with this phone:');
    const remainingUsers = await User.find({ phone });
    remainingUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.role}) - Active: ${u.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

deleteBeneficiary();
