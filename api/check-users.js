#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Role } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('name email phone role isActive');
    
    console.log(`📊 Total Users: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
    } else {
      console.log('👥 Users:');
      console.log('========');
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log('');
      });
    }

    // Check roles
    const roles = await Role.find({}).select('name displayName level');
    console.log(`\n🔐 Total Roles: ${roles.length}\n`);
    
    if (roles.length > 0) {
      console.log('📋 Roles:');
      console.log('========');
      roles.forEach((role, idx) => {
        console.log(`${idx + 1}. ${role.displayName} (${role.name}) - Level ${role.level}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

checkUsers().then(() => process.exit(0));
