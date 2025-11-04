const mongoose = require('mongoose');
const { ActivityLog, User } = require('../models');
require('dotenv').config();

const sampleActivities = [
  {
    action: 'login',
    resource: 'auth',
    description: 'User logged in successfully',
    status: 'success',
    severity: 'low',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    location: { country: 'IN', region: 'KL', city: 'Kochi' },
    metadata: { endpoint: '/api/auth/verify-otp', method: 'POST', statusCode: 200, duration: 150 }
  },
  {
    action: 'user_created',
    resource: 'user',
    description: 'New user account created',
    status: 'success',
    severity: 'medium',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    location: { country: 'IN', region: 'KL', city: 'Thiruvananthapuram' },
    metadata: { endpoint: '/api/users', method: 'POST', statusCode: 201, duration: 300 }
  },
  {
    action: 'beneficiary_approved',
    resource: 'beneficiary',
    description: 'Beneficiary application approved',
    status: 'success',
    severity: 'high',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
    location: { country: 'IN', region: 'KL', city: 'Kozhikode' },
    metadata: { endpoint: '/api/beneficiaries/123/approve', method: 'PATCH', statusCode: 200, duration: 500 }
  },
  {
    action: 'login_failed',
    resource: 'auth',
    description: 'Failed login attempt - invalid OTP',
    status: 'failed',
    severity: 'medium',
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    location: { country: 'IN', region: 'KL', city: 'Kochi' },
    metadata: { endpoint: '/api/auth/verify-otp', method: 'POST', statusCode: 401, duration: 100 }
  },
  {
    action: 'payment_processed',
    resource: 'payment',
    description: 'Payment processed successfully',
    status: 'success',
    severity: 'high',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    location: { country: 'IN', region: 'KL', city: 'Malappuram' },
    metadata: { endpoint: '/api/payments/456/process', method: 'PATCH', statusCode: 200, duration: 800 }
  },
  {
    action: 'data_export',
    resource: 'report',
    description: 'Beneficiary data exported to CSV',
    status: 'success',
    severity: 'medium',
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    location: { country: 'IN', region: 'KL', city: 'Kannur' },
    metadata: { endpoint: '/api/beneficiaries/export', method: 'GET', statusCode: 200, duration: 2000 }
  },
  {
    action: 'system_backup',
    resource: 'system',
    description: 'System backup completed successfully',
    status: 'success',
    severity: 'low',
    ipAddress: '127.0.0.1',
    userAgent: 'System',
    location: { country: 'IN', region: 'KL', city: 'Kochi' },
    metadata: { endpoint: '/api/system/backup', method: 'POST', statusCode: 200, duration: 30000 }
  },
  {
    action: 'unauthorized_access',
    resource: 'system',
    description: 'Unauthorized access attempt detected',
    status: 'failed',
    severity: 'critical',
    ipAddress: '203.0.113.1',
    userAgent: 'curl/7.68.0',
    location: { country: 'US', region: 'CA', city: 'San Francisco' },
    metadata: { endpoint: '/api/admin/users', method: 'GET', statusCode: 403, duration: 50 }
  }
];

async function createTestActivityLogs() {
  try {
    console.log('🔄 Creating test activity logs...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database');

    // Get a sample user for the logs
    const sampleUser = await User.findOne({ role: { $in: ['super_admin', 'state_admin'] } });
    
    if (!sampleUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`👤 Using user: ${sampleUser.name} (${sampleUser.role})`);

    // Create activity logs with different timestamps
    const logs = [];
    for (let i = 0; i < sampleActivities.length; i++) {
      const activity = sampleActivities[i];
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - (i * 2)); // Spread logs over time
      
      const logData = {
        ...activity,
        userId: sampleUser._id,
        timestamp,
        details: {
          sampleData: true,
          testLog: true,
          index: i
        }
      };

      const log = new ActivityLog(logData);
      await log.save();
      logs.push(log);
      
      console.log(`✅ Created log: ${activity.action} - ${activity.description}`);
    }

    console.log(`🎉 Successfully created ${logs.length} test activity logs!`);
    
  } catch (error) {
    console.error('❌ Error creating test activity logs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  createTestActivityLogs();
}

module.exports = createTestActivityLogs;