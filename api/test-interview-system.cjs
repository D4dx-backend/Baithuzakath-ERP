const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath-erp');

const Application = require('./src/models/Application');
const User = require('./src/models/User');

async function testInterviewSystem() {
  try {
    console.log('🔍 Testing Interview System...\n');

    // Find some applications to test with
    const applications = await Application.find({ status: 'under_review' })
      .populate('beneficiary', 'name phone')
      .populate('scheme', 'name')
      .populate('project', 'name')
      .limit(3);

    console.log(`Found ${applications.length} applications in review status:`);
    applications.forEach(app => {
      console.log(`- ${app.applicationNumber}: ${app.beneficiary.name} (${app.scheme.name})`);
    });

    if (applications.length === 0) {
      console.log('❌ No applications found in review status. Creating a test application...');
      
      // You would need to create a test application here
      // For now, let's just show the structure
      console.log('\nTo test the interview system:');
      console.log('1. Create an application with status "under_review"');
      console.log('2. Use the shortlist modal to schedule an interview');
      console.log('3. Check the upcoming interviews page');
      console.log('4. Complete the interview from the interviews page');
      
      return;
    }

    // Test scheduling an interview for the first application
    const testApp = applications[0];
    console.log(`\n📅 Scheduling interview for: ${testApp.beneficiary.name}`);

    // Update application with interview details
    testApp.status = 'interview_scheduled';
    testApp.interview = {
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      scheduledTime: '10:00 AM',
      type: 'offline',
      location: 'District Office, Room 201',
      interviewers: [],
      scheduledBy: testApp.createdBy,
      scheduledAt: new Date(),
      notes: 'Test interview scheduled via script',
      result: 'pending'
    };

    await testApp.save();
    console.log('✅ Interview scheduled successfully!');

    // Find all scheduled interviews
    const scheduledInterviews = await Application.find({ 
      status: { $in: ['interview_scheduled', 'interview_completed'] }
    })
    .populate('beneficiary', 'name phone')
    .populate('scheme', 'name')
    .populate('project', 'name')
    .populate('state', 'name')
    .populate('district', 'name')
    .populate('area', 'name')
    .populate('unit', 'name');

    console.log(`\n📋 Found ${scheduledInterviews.length} scheduled interviews:`);
    scheduledInterviews.forEach(app => {
      console.log(`- ${app.applicationNumber}: ${app.beneficiary.name}`);
      console.log(`  Status: ${app.status}`);
      console.log(`  Date: ${app.interview.scheduledDate?.toLocaleDateString()}`);
      console.log(`  Time: ${app.interview.scheduledTime}`);
      console.log(`  Location: ${app.interview.location || 'N/A'}`);
      console.log(`  Type: ${app.interview.type}`);
      console.log('');
    });

    console.log('✅ Interview system test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: cd baithuzkath-api && npm start');
    console.log('2. Start the frontend: npm run dev');
    console.log('3. Navigate to /upcoming-interviews to see the scheduled interviews');
    console.log('4. Test scheduling more interviews from the Applications page');

  } catch (error) {
    console.error('❌ Error testing interview system:', error);
  } finally {
    mongoose.connection.close();
  }
}

testInterviewSystem();