const mongoose = require('mongoose');
const { Permission, Role } = require('../models');
require('dotenv').config();

const paymentReceiptPermissions = [
  {
    name: 'payment_receipts.generate',
    displayName: 'Generate Payment Receipts',
    description: 'Generate PDF receipts for completed payments',
    module: 'finances',
    category: 'create',
    resource: 'payment_receipt',
    action: 'generate',
    scope: 'regional',
    securityLevel: 'internal'
  },
  {
    name: 'payment_receipts.download',
    displayName: 'Download Payment Receipts',
    description: 'Download generated PDF receipts',
    module: 'finances',
    category: 'read',
    resource: 'payment_receipt',
    action: 'download',
    scope: 'regional',
    securityLevel: 'internal'
  },
  {
    name: 'payment_receipts.bulk_generate',
    displayName: 'Bulk Generate Receipts',
    description: 'Generate receipts for multiple payments at once',
    module: 'finances',
    category: 'create',
    resource: 'payment_receipt',
    action: 'bulk_generate',
    scope: 'regional',
    securityLevel: 'restricted',
    auditRequired: true
  },
  {
    name: 'payment_receipts.list',
    displayName: 'List Payment Receipts',
    description: 'View list of all generated payment receipts',
    module: 'finances',
    category: 'read',
    resource: 'payment_receipt',
    action: 'list',
    scope: 'regional',
    securityLevel: 'internal'
  }
];

async function addPaymentReceiptPermissions() {
  try {
    console.log('🧾 Adding Payment Receipt permissions...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database');

    // Create permissions
    const createdPermissions = [];
    for (const permissionData of paymentReceiptPermissions) {
      const existingPermission = await Permission.findOne({ name: permissionData.name });
      
      if (!existingPermission) {
        const permission = new Permission({
          ...permissionData,
          type: 'system',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await permission.save();
        createdPermissions.push(permission);
        console.log(`✅ Created permission: ${permissionData.name}`);
      } else {
        console.log(`⚠️  Permission already exists: ${permissionData.name}`);
      }
    }

    // Add permissions to super_admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (superAdminRole) {
      const newPermissionIds = createdPermissions.map(p => p._id);
      
      // Add new permissions to super admin if not already present
      const permissionsToAdd = newPermissionIds.filter(id => 
        !superAdminRole.permissions.includes(id)
      );
      
      if (permissionsToAdd.length > 0) {
        superAdminRole.permissions.push(...permissionsToAdd);
        await superAdminRole.save();
        console.log(`✅ Added ${permissionsToAdd.length} permissions to super_admin role`);
      }
    }

    // Add permissions to state_admin role
    const stateAdminRole = await Role.findOne({ name: 'state_admin' });
    if (stateAdminRole) {
      const standardPermissions = await Permission.find({ 
        name: { $in: ['payment_receipts.generate', 'payment_receipts.download', 'payment_receipts.list'] }
      });
      
      const permissionsToAdd = standardPermissions.filter(permission => 
        !stateAdminRole.permissions.includes(permission._id)
      );
      
      if (permissionsToAdd.length > 0) {
        stateAdminRole.permissions.push(...permissionsToAdd.map(p => p._id));
        await stateAdminRole.save();
        console.log(`✅ Added ${permissionsToAdd.length} permissions to state_admin role`);
      }
    }

    // Add permissions to district_admin role
    const districtAdminRole = await Role.findOne({ name: 'district_admin' });
    if (districtAdminRole) {
      const standardPermissions = await Permission.find({ 
        name: { $in: ['payment_receipts.generate', 'payment_receipts.download', 'payment_receipts.list'] }
      });
      
      const permissionsToAdd = standardPermissions.filter(permission => 
        !districtAdminRole.permissions.includes(permission._id)
      );
      
      if (permissionsToAdd.length > 0) {
        districtAdminRole.permissions.push(...permissionsToAdd.map(p => p._id));
        await districtAdminRole.save();
        console.log(`✅ Added ${permissionsToAdd.length} permissions to district_admin role`);
      }
    }

    // Add basic permissions to finance_officer role
    const financeOfficerRole = await Role.findOne({ name: 'finance_officer' });
    if (financeOfficerRole) {
      const basicPermissions = await Permission.find({ 
        name: { $in: ['payment_receipts.generate', 'payment_receipts.download'] }
      });
      
      const permissionsToAdd = basicPermissions.filter(permission => 
        !financeOfficerRole.permissions.includes(permission._id)
      );
      
      if (permissionsToAdd.length > 0) {
        financeOfficerRole.permissions.push(...permissionsToAdd.map(p => p._id));
        await financeOfficerRole.save();
        console.log(`✅ Added ${permissionsToAdd.length} permissions to finance_officer role`);
      }
    }

    console.log('🎉 Payment Receipt permissions setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error adding Payment Receipt permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  addPaymentReceiptPermissions();
}

module.exports = addPaymentReceiptPermissions;