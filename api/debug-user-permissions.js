const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath-erp');

const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Permission = require('./src/models/Permission');

async function debugUserPermissions() {
  try {
    console.log('🔍 Debugging user permissions...\n');

    // Find all users
    const users = await User.find({});

    console.log(`Found ${users.length} users in the system:\n`);

    for (const user of users) {
      console.log(`👤 User: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role || 'No role assigned'}`);
      
      if (user.role) {
        // Get the role document and its permissions
        const roleDoc = await Role.findOne({ name: user.role }).populate('permissions', 'name');
        
        if (roleDoc) {
          const reportsPermissions = roleDoc.permissions.filter(p => 
            p.name.startsWith('reports.')
          );
          
          console.log(`   Reports Permissions (${reportsPermissions.length}):`);
          if (reportsPermissions.length > 0) {
            reportsPermissions.forEach(perm => {
              console.log(`     ✅ ${perm.name}`);
            });
          } else {
            console.log(`     ❌ No reports permissions found`);
          }
        } else {
          console.log(`   ❌ Role document not found in database`);
        }
      } else {
        console.log(`   ❌ No role assigned`);
      }
      console.log('');
    }

    // Check all reports permissions in database
    console.log('\n📋 All reports permissions in database:');
    const reportsPermissions = await Permission.find({ 
      name: { $regex: /^reports\./i } 
    }).select('name description');
    
    reportsPermissions.forEach(perm => {
      console.log(`   - ${perm.name}: ${perm.description}`);
    });

    // Check all roles and their reports permissions
    console.log('\n👥 Roles with reports permissions:');
    const roles = await Role.find({}).populate('permissions', 'name');
    
    for (const role of roles) {
      const roleReportsPerms = role.permissions.filter(p => 
        p.name.startsWith('reports.')
      );
      
      if (roleReportsPerms.length > 0) {
        console.log(`   ${role.name} (${roleReportsPerms.length} permissions):`);
        roleReportsPerms.forEach(perm => {
          console.log(`     - ${perm.name}`);
        });
      }
    }

    console.log('\n🔧 Suggested fixes:');
    console.log('1. If user has no role: Assign appropriate role');
    console.log('2. If role has no reports permissions: Update role permissions');
    console.log('3. If permissions exist but user still gets error: Clear user session/cache');
    console.log('4. If user needs to re-login: JWT token might have old permissions cached');

  } catch (error) {
    console.error('❌ Error debugging permissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the debug
debugUserPermissions();