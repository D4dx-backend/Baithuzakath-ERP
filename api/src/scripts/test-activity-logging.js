const axios = require('axios');
const mongoose = require('mongoose');
const { ActivityLog } = require('../models');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5009';

// Test scenarios to verify activity logging
const testScenarios = [
  {
    name: 'Health Check (Public)',
    method: 'GET',
    url: '/health',
    expectedAction: 'data_accessed',
    expectedResource: 'system'
  },
  {
    name: 'OTP Request (Auth)',
    method: 'POST',
    url: '/api/auth/send-otp',
    data: { phone: '1234567890', purpose: 'login' },
    expectedAction: 'otp_requested',
    expectedResource: 'auth'
  },
  {
    name: 'Invalid Login (Auth Failure)',
    method: 'POST',
    url: '/api/auth/verify-otp',
    data: { phone: '1234567890', otp: '000000', purpose: 'login' },
    expectedAction: 'login_failed',
    expectedResource: 'auth'
  },
  {
    name: 'Unauthorized Access (No Token)',
    method: 'GET',
    url: '/api/users',
    expectedAction: 'unauthorized_access',
    expectedResource: 'user'
  },
  {
    name: 'Permission Denied (Invalid Token)',
    method: 'GET',
    url: '/api/activity-logs',
    headers: { 'Authorization': 'Bearer invalid_token' },
    expectedAction: 'permission_denied',
    expectedResource: 'activity_log'
  }
];

async function testActivityLogging() {
  try {
    console.log('🧪 Testing Activity Logging System...\n');
    
    // Connect to database to check logs
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database\n');

    // Get initial log count
    const initialLogCount = await ActivityLog.countDocuments();
    console.log(`📈 Initial log count: ${initialLogCount}\n`);

    const results = [];

    // Run test scenarios
    for (const scenario of testScenarios) {
      console.log(`🔍 Testing: ${scenario.name}`);
      
      try {
        const config = {
          method: scenario.method,
          url: `${API_BASE_URL}${scenario.url}`,
          headers: {
            'Content-Type': 'application/json',
            ...scenario.headers
          },
          validateStatus: () => true // Don't throw on error status codes
        };

        if (scenario.data) {
          config.data = scenario.data;
        }

        const startTime = Date.now();
        const response = await axios(config);
        const endTime = Date.now();

        console.log(`   📡 Response: ${response.status} ${response.statusText}`);
        console.log(`   ⏱️  Duration: ${endTime - startTime}ms`);

        // Wait a moment for async logging to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if activity was logged
        const recentLogs = await ActivityLog.find({
          timestamp: { $gte: new Date(startTime - 1000) }
        }).sort({ timestamp: -1 }).limit(5);

        const matchingLog = recentLogs.find(log => 
          log.metadata?.endpoint === scenario.url &&
          log.metadata?.method === scenario.method
        );

        if (matchingLog) {
          console.log(`   ✅ Activity logged successfully`);
          console.log(`      Action: ${matchingLog.action}`);
          console.log(`      Resource: ${matchingLog.resource}`);
          console.log(`      Status: ${matchingLog.status}`);
          console.log(`      Description: ${matchingLog.description}`);
          
          results.push({
            scenario: scenario.name,
            success: true,
            logged: true,
            action: matchingLog.action,
            resource: matchingLog.resource,
            status: matchingLog.status
          });
        } else {
          console.log(`   ❌ Activity NOT logged`);
          results.push({
            scenario: scenario.name,
            success: false,
            logged: false,
            reason: 'No matching log found'
          });
        }

      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
        results.push({
          scenario: scenario.name,
          success: false,
          logged: false,
          reason: error.message
        });
      }

      console.log(''); // Empty line for readability
    }

    // Get final log count
    const finalLogCount = await ActivityLog.countDocuments();
    console.log(`📈 Final log count: ${finalLogCount}`);
    console.log(`📊 New logs created: ${finalLogCount - initialLogCount}\n`);

    // Summary
    console.log('📋 TEST SUMMARY:');
    console.log('================');
    
    const successCount = results.filter(r => r.logged).length;
    const totalCount = results.length;
    
    console.log(`✅ Successfully logged: ${successCount}/${totalCount}`);
    console.log(`❌ Failed to log: ${totalCount - successCount}/${totalCount}\n`);

    // Detailed results
    results.forEach(result => {
      const status = result.logged ? '✅' : '❌';
      console.log(`${status} ${result.scenario}`);
      if (result.logged) {
        console.log(`   Action: ${result.action}, Resource: ${result.resource}, Status: ${result.status}`);
      } else {
        console.log(`   Reason: ${result.reason}`);
      }
    });

    // Show recent activity logs
    console.log('\n📜 RECENT ACTIVITY LOGS:');
    console.log('========================');
    
    const recentLogs = await ActivityLog.find()
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .limit(10);

    recentLogs.forEach((log, index) => {
      const user = log.userId ? `${log.userId.name} (${log.userId.role})` : 'System/Anonymous';
      const timestamp = log.timestamp.toISOString().replace('T', ' ').substring(0, 19);
      console.log(`${index + 1}. [${timestamp}] ${user} - ${log.action} on ${log.resource} (${log.status})`);
      console.log(`   ${log.description}`);
      if (log.metadata?.endpoint) {
        console.log(`   ${log.metadata.method} ${log.metadata.endpoint} (${log.metadata.statusCode})`);
      }
      console.log('');
    });

    console.log('🎉 Activity logging test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from database');
  }
}

// Run the test
if (require.main === module) {
  testActivityLogging();
}

module.exports = testActivityLogging;