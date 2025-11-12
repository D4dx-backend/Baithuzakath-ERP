/**
 * Migration Script: Update User AdminScope with Separate Location References
 * 
 * This script updates existing users to have separate district, area, and unit
 * references in their adminScope for easier hierarchy display.
 * 
 * Before: adminScope.regions = [areaId]
 * After:  adminScope.district = districtId
 *         adminScope.area = areaId
 *         adminScope.regions = [areaId]
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

// Define schemas (minimal versions)
const locationSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['state', 'district', 'area', 'unit'] },
  code: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  isActive: Boolean
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
  adminScope: {
    level: String,
    regions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    area: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    schemes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scheme' }]
  }
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);
const User = mongoose.model('User', userSchema);

// Migration function
const migrateUsers = async () => {
  try {
    console.log('\n🔄 Starting user location migration...\n');

    // Find all users with adminScope.regions
    const users = await User.find({
      'adminScope.regions.0': { $exists: true },
      role: { $in: ['district_admin', 'area_admin', 'unit_admin'] }
    });

    console.log(`📊 Found ${users.length} users to migrate\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const regionId = user.adminScope.regions[0];
        
        // Check if already migrated
        if (user.adminScope.district || user.adminScope.area || user.adminScope.unit) {
          console.log(`⏭️  Skipping ${user.name} (${user.role}) - Already migrated`);
          skipCount++;
          continue;
        }

        // Fetch the location with parent populated
        const location = await Location.findById(regionId).populate('parent');
        
        if (!location) {
          console.log(`⚠️  Warning: Location not found for user ${user.name}`);
          errorCount++;
          continue;
        }

        const updates = {};

        if (user.role === 'district_admin') {
          // District admin: just set district
          updates['adminScope.district'] = location._id;
          console.log(`✅ ${user.name} (District Admin) -> District: ${location.name}`);
        } 
        else if (user.role === 'area_admin') {
          // Area admin: set district and area
          updates['adminScope.area'] = location._id;
          
          if (location.parent) {
            updates['adminScope.district'] = location.parent._id;
            console.log(`✅ ${user.name} (Area Admin) -> District: ${location.parent.name}, Area: ${location.name}`);
          } else {
            console.log(`⚠️  Warning: Area ${location.name} has no parent district`);
            updates['adminScope.district'] = null;
          }
        } 
        else if (user.role === 'unit_admin') {
          // Unit admin: set district, area, and unit
          updates['adminScope.unit'] = location._id;
          
          if (location.parent) {
            // Fetch area's parent (district)
            const area = await Location.findById(location.parent._id).populate('parent');
            updates['adminScope.area'] = area._id;
            
            if (area.parent) {
              updates['adminScope.district'] = area.parent._id;
              console.log(`✅ ${user.name} (Unit Admin) -> District: ${area.parent.name}, Area: ${area.name}, Unit: ${location.name}`);
            } else {
              console.log(`⚠️  Warning: Area ${area.name} has no parent district`);
              updates['adminScope.district'] = null;
            }
          } else {
            console.log(`⚠️  Warning: Unit ${location.name} has no parent area`);
            updates['adminScope.area'] = null;
            updates['adminScope.district'] = null;
          }
        }

        // Update the user
        await User.updateOne({ _id: user._id }, { $set: updates });
        successCount++;

      } catch (error) {
        console.error(`❌ Error migrating user ${user.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ⏭️  Skipped (already migrated): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total processed: ${users.length}\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration
const run = async () => {
  try {
    await connectDB();
    await migrateUsers();
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

run();
