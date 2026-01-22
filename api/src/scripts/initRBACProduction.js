const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const rbacService = require('../services/rbacService');
const { User, Role, UserRole } = require('../models');
const config = require('../config/environment');

/**
 * Initialize RBAC System for Production
 * This script can be run directly on the server to initialize/update RBAC
 */
async function initRBACProduction() {
  try {
    console.log('🔐 Initializing RBAC System for Production...');
    console.log('=====================================\n');

    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Initialize RBAC (creates permissions and roles)
    console.log('📋 Step 1: Creating permissions and roles...');
    await rbacService.initializeRBAC();
    console.log('✅ RBAC system initialized\n');

    // Step 2: Fix user role assignments
    console.log('📋 Step 2: Fixing user role assignments...');
    const users = await User.find({ isActive: true });
    console.log(`   Found ${users.length} active users\n`);

    let assignedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if user already has UserRole entries
        const existingUserRoles = await UserRole.find({
          user: user._id,
          isActive: true
        });

        if (existingUserRoles.length > 0) {
          skippedCount++;
          continue;
        }

        // Find the role by name
        if (!user.role) {
          console.log(`⚠️  User ${user.name} (${user.email || user.phone}) has no role field`);
          errorCount++;
          continue;
        }

        const role = await Role.findOne({ name: user.role });
        if (!role) {
          console.log(`❌ Role '${user.role}' not found for user ${user.name}`);
          errorCount++;
          continue;
        }

        // Find a state admin or the user themselves to assign the role
        let assignedBy = user._id;
        const stateAdmin = await User.findOne({ role: 'state_admin' });
        if (stateAdmin) {
          assignedBy = stateAdmin._id;
        }

        // Create UserRole entry
        const userRole = new UserRole({
          user: user._id,
          role: role._id,
          assignedBy: assignedBy,
          assignmentReason: 'Auto-assigned during production RBAC initialization',
          isPrimary: true,
          approvalStatus: 'approved',
          isActive: true
        });

        await userRole.save();
        console.log(`✅ Assigned role '${user.role}' to ${user.name} (${user.email || user.phone})`);
        assignedCount++;
      } catch (error) {
        console.error(`❌ Error processing user ${user.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=====================================');
    console.log('📊 Summary:');
    console.log(`   ✅ Roles assigned: ${assignedCount}`);
    console.log(`   ⏭️  Already assigned: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('=====================================\n');

    // Step 3: Verify permissions
    console.log('📋 Step 3: Verifying permissions...');
    const areaAdminRole = await Role.findOne({ name: 'area_admin' }).populate('permissions');
    const unitAdminRole = await Role.findOne({ name: 'unit_admin' }).populate('permissions');
    
    if (areaAdminRole) {
      const permNames = areaAdminRole.permissions.map(p => p.name);
      const hasFinances = permNames.includes('finances.read.regional');
      const hasDonors = permNames.includes('donors.read.regional');
      const hasUsers = permNames.includes('users.read.regional');
      
      console.log(`   area_admin permissions: ${areaAdminRole.permissions.length} total`);
      console.log(`   ✓ finances.read.regional: ${hasFinances ? '✅' : '❌'}`);
      console.log(`   ✓ donors.read.regional: ${hasDonors ? '✅' : '❌'}`);
      console.log(`   ✓ users.read.regional: ${hasUsers ? '✅' : '❌'}`);
    }
    
    if (unitAdminRole) {
      const permNames = unitAdminRole.permissions.map(p => p.name);
      const hasFinances = permNames.includes('finances.read.regional');
      const hasDonors = permNames.includes('donors.read.regional');
      const hasDashboard = permNames.includes('dashboard.read.regional');
      
      console.log(`   unit_admin permissions: ${unitAdminRole.permissions.length} total`);
      console.log(`   ✓ finances.read.regional: ${hasFinances ? '✅' : '❌'}`);
      console.log(`   ✓ donors.read.regional: ${hasDonors ? '✅' : '❌'}`);
      console.log(`   ✓ dashboard.read.regional: ${hasDashboard ? '✅' : '❌'}`);
    }

    console.log('\n✅ Production RBAC initialization completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your API server to ensure all changes are loaded');
    console.log('   2. Test the dashboard - 403 errors should be resolved');
    console.log('   3. If issues persist, check user role assignments in the database\n');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing RBAC system:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
initRBACProduction();
