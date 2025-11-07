const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('./src/models');

async function checkBeneficiaryUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const phone = '9876543214'; // The phone number from your test
    const user = await User.findOne({ phone });

    if (!user) {
      console.log('❌ User not found with phone:', phone);
      return;
    }

    console.log('\n📋 User Details:');
    console.log('- ID:', user._id);
    console.log('- Name:', user.name);
    console.log('- Phone:', user.phone);
    console.log('- Role:', user.role);
    console.log('- Is Active:', user.isActive);
    console.log('- Is Verified:', user.isVerified);
    console.log('- Created At:', user.createdAt);

    if (!user.role || user.role !== 'beneficiary') {
      console.log('\n⚠️  ISSUE FOUND: User role is not set to "beneficiary"');
      console.log('Fixing user role...');
      
      user.role = 'beneficiary';
      await user.save();
      
      console.log('✅ User role updated to "beneficiary"');
    } else {
      console.log('\n✅ User role is correctly set to "beneficiary"');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkBeneficiaryUser();
