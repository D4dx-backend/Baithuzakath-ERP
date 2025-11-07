const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('./src/models');
const authService = require('./src/services/authService');

async function generateToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const phone = '9876543214';
    const user = await User.findOne({ phone });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📋 User Details:');
    console.log('- ID:', user._id);
    console.log('- Name:', user.name);
    console.log('- Phone:', user.phone);
    console.log('- Role:', user.role);

    const token = authService.generateToken(user);
    
    console.log('\n🔑 Generated Token:');
    console.log(token);
    
    console.log('\n📝 To test in browser console:');
    console.log(`localStorage.setItem('beneficiary_token', '${token}');`);
    console.log(`localStorage.setItem('user_role', 'beneficiary');`);
    console.log(`location.reload();`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

generateToken();
