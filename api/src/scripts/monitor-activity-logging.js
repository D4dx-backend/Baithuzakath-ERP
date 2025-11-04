const mongoose = require('mongoose');
const { ActivityLog } = require('../models');
require('dotenv').config();

let isMonitoring = false;

async function monitorActivityLogging() {
  try {
    console.log('🔍 Starting Activity Log Monitor...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database');
    console.log('👀 Monitoring new activity logs (Press Ctrl+C to stop)...\n');

    isMonitoring = true;
    let lastLogCount = await ActivityLog.countDocuments();
    
    // Monitor for new logs every 2 seconds
    const monitorInterval = setInterval(async () => {
      if (!isMonitoring) {
        clearInterval(monitorInterval);
        return;
      }

      try {
        const currentLogCount = await ActivityLog.countDocuments();
        
        if (currentLogCount > lastLogCount) {
          const newLogsCount = currentLogCount - lastLogCount;
          console.log(`📈 ${newLogsCount} new activity log(s) detected!`);
          
          // Get the new logs
          const newLogs = await ActivityLog.find()
            .populate('userId', 'name role')
            .sort({ timestamp: -1 })
            .limit(newLogsCount);

          newLogs.reverse().forEach((log, index) => {
            const user = log.userId ? `${log.userId.name} (${log.userId.role})` : 'System/Anonymous';
            const timestamp = log.timestamp.toISOString().replace('T', ' ').substring(0, 19);
            const statusIcon = log.status === 'success' ? '✅' : 
                              log.status === 'failed' ? '❌' : 
                              log.status === 'warning' ? '⚠️' : 'ℹ️';
            
            console.log(`${statusIcon} [${timestamp}] ${user}`);
            console.log(`   Action: ${log.action} on ${log.resource}`);
            console.log(`   Description: ${log.description}`);
            if (log.metadata?.endpoint) {
              console.log(`   Request: ${log.metadata.method} ${log.metadata.endpoint} (${log.metadata.statusCode || 'N/A'})`);
            }
            if (log.ipAddress) {
              console.log(`   IP: ${log.ipAddress}`);
            }
            console.log('');
          });
          
          lastLogCount = currentLogCount;
        }
      } catch (error) {
        console.error('❌ Monitor error:', error.message);
      }
    }, 2000);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping monitor...');
      isMonitoring = false;
      clearInterval(monitorInterval);
      await mongoose.disconnect();
      console.log('📊 Disconnected from database');
      console.log('👋 Monitor stopped');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Monitor startup failed:', error);
    process.exit(1);
  }
}

// Show recent activity on startup
async function showRecentActivity() {
  try {
    console.log('📜 RECENT ACTIVITY (Last 10 logs):');
    console.log('==================================');
    
    const recentLogs = await ActivityLog.find()
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .limit(10);

    if (recentLogs.length === 0) {
      console.log('No activity logs found.\n');
      return;
    }

    recentLogs.forEach((log, index) => {
      const user = log.userId ? `${log.userId.name} (${log.userId.role})` : 'System/Anonymous';
      const timestamp = log.timestamp.toISOString().replace('T', ' ').substring(0, 19);
      const statusIcon = log.status === 'success' ? '✅' : 
                        log.status === 'failed' ? '❌' : 
                        log.status === 'warning' ? '⚠️' : 'ℹ️';
      
      console.log(`${statusIcon} [${timestamp}] ${user}`);
      console.log(`   ${log.action} on ${log.resource} - ${log.description}`);
      if (log.metadata?.endpoint) {
        console.log(`   ${log.metadata.method} ${log.metadata.endpoint}`);
      }
    });
    
    console.log('');
  } catch (error) {
    console.error('❌ Failed to show recent activity:', error);
  }
}

// Run the monitor
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(showRecentActivity)
    .then(monitorActivityLogging)
    .catch(error => {
      console.error('❌ Failed to start monitor:', error);
      process.exit(1);
    });
}

module.exports = { monitorActivityLogging, showRecentActivity };