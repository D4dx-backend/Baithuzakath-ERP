const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('./src/models');
const authService = require('./src/services/authService');

async function testMiddlewareLogic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const phone = '9876543214';
    const user = await User.findOne({ phone });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📋 User from DB:');
    console.log('- ID:', user._id.toString());
    console.log('- Role:', user.role);
    console.log('- Role type:', typeof user.role);
    console.log('- Is Active:', user.isActive);

    // Generate token
    const token = authService.generateToken(user);
    
    // Verify token (like authenticate middleware does)
    const decoded = authService.verifyToken(token);
    console.log('\n📋 Decoded Token:');
    console.log('- userId:', decoded.userId);
    console.log('- role:', decoded.role);
    console.log('- role type:', typeof decoded.role);

    // Get user from database (like authenticate middleware does)
    const userFromDB = await User.findById(decoded.userId);
    console.log('\n📋 User fetched from DB (like middleware):');
    console.log('- ID:', userFromDB._id.toString());
    console.log('- Role:', userFromDB.role);
    console.log('- Role type:', typeof userFromDB.role);
    console.log('- Is Active:', userFromDB.isActive);

    // Test authorization logic (like authorize middleware does)
    const requiredRoles = ['beneficiary'];
    console.log('\n🔍 Authorization Check:');
    console.log('- Required roles:', requiredRoles);
    console.log('- User role:', userFromDB.role);
    console.log('- Includes check:', requiredRoles.includes(userFromDB.role));
    console.log('- Strict equality:', userFromDB.role === 'beneficiary');

    // Check if there are any hidden characters
    console.log('\n🔍 Detailed Role Analysis:');
    console.log('- Role length:', userFromDB.role.length);
    console.log('- Role charCodes:', Array.from(userFromDB.role).map(c => c.charCodeAt(0)));
    console.log('- Expected charCodes:', Array.from('beneficiary').map(c => c.charCodeAt(0)));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testMiddlewareLogic();
