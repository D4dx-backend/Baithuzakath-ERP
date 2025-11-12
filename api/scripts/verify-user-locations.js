/**
 * Verification Script: Check User Location Migration Status
 * 
 * This script verifies that users have been properly migrated with
 * separate district, area, and unit references.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas
const locationSchema = new mongoose.Schema({
  name: String,
  type: String,
  code: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: String,
  role: String,
  adminScope: {
    level: String,
    regions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    area: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }
  }
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);
const User = mongoose.model('User', userSchema);

// Verification function
const verifyMigration = async () => {
  try {
    console.log('\n🔍 Verifying user location migration...\n');

    // Get all admin users
    const users = await User.find({
      role: { $in: ['district_admin', 'area_admin', 'unit_admin'] }
    })
    .populate('adminScope.district')
    .populate('adminScope.area')
    .populate('adminScope.unit');

    console.log(`📊 Found ${users.length} admin users\n`);

    let migratedCount = 0;
    let notMigratedCount = 0;
    let issuesCount = 0;

    for (const user of users) {
      const hasDistrict = !!user.adminScope?.district;
      const hasArea = !!user.adminScope?.area;
      const hasUnit = !!user.adminScope?.unit;

      let status = '';
      let icon = '';

      if (user.role === 'district_admin') {
        if (hasDistrict) {
          status = `✅ Migrated - District: ${user.adminScope.district.name}`;
          icon = '✅';
          migratedCount++;
        } else {
          status = '❌ Not migrated - Missing district reference';
          icon = '❌';
          notMigratedCount++;
        }
      } 
      else if (user.role === 'area_admin') {
        if (hasDistrict && hasArea) {
          status = `✅ Migrated - District: ${user.adminScope.district.name}, Area: ${user.adminScope.area.name}`;
          icon = '✅';
          migratedCount++;
        } else if (hasArea && !hasDistrict) {
          status = `⚠️  Partial - Area: ${user.adminScope.area.name}, Missing district`;
          icon = '⚠️';
          issuesCount++;
        } else {
          status = '❌ Not migrated - Missing area/district references';
          icon = '❌';
          notMigratedCount++;
        }
      } 
      else if (user.role === 'unit_admin') {
        if (hasDistrict && hasArea && hasUnit) {
          status = `✅ Migrated - District: ${user.adminScope.district.name}, Area: ${user.adminScope.area.name}, Unit: ${user.adminScope.unit.name}`;
          icon = '✅';
          migratedCount++;
        } else if (hasUnit) {
          const missing = [];
          if (!hasDistrict) missing.push('district');
          if (!hasArea) missing.push('area');
          status = `⚠️  Partial - Unit: ${user.adminScope.unit.name}, Missing: ${missing.join(', ')}`;
          icon = '⚠️';
          issuesCount++;
        } else {
          status = '❌ Not migrated - Missing unit/area/district references';
          icon = '❌';
          notMigratedCount++;
        }
      }

      console.log(`${icon} ${user.name} (${user.role})`);
      console.log(`   ${status}\n`);
    }

    console.log('📈 Verification Summary:');
    console.log(`   ✅ Fully migrated: ${migratedCount}`);
    console.log(`   ⚠️  Partial/Issues: ${issuesCount}`);
    console.log(`   ❌ Not migrated: ${notMigratedCount}`);
    console.log(`   📊 Total: ${users.length}\n`);

    if (notMigratedCount > 0) {
      console.log('⚠️  Some users need migration. Run: node scripts/migrate-user-locations.js\n');
    } else if (issuesCount > 0) {
      console.log('⚠️  Some users have partial data. Check location hierarchy.\n');
    } else {
      console.log('✅ All users are properly migrated!\n');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
};

// Run verification
const run = async () => {
  try {
    await connectDB();
    await verifyMigration();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
};

run();
