const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath-erp');

const Application = require('./src/models/Application');
const Interview = require('./src/models/Interview');
const User = require('./src/models/User');

async function migrateInterviews() {
  try {
    console.log('🔄 Starting interview data migration...\n');

    // Find all applications that have interview data
    const applicationsWithInterviews = await Application.find({
      $and: [
        { 'interview': { $exists: true } },
        { 'interview.scheduledDate': { $exists: true } }
      ]
    }).populate('createdBy', 'name');

    console.log(`Found ${applicationsWithInterviews.length} applications with interview data:`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const app of applicationsWithInterviews) {
      console.log(`\n📋 Processing: ${app.applicationNumber}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Interview Date: ${app.interview.scheduledDate}`);
      console.log(`   Interview Time: ${app.interview.scheduledTime}`);

      // Check if interview already exists in Interview model
      const existingInterview = await Interview.findOne({ application: app._id });
      
      if (existingInterview) {
        console.log(`   ⏭️  Skipped - Interview already exists: ${existingInterview.interviewNumber}`);
        skippedCount++;
        continue;
      }

      // Create new Interview record
      const interviewData = {
        application: app._id,
        scheduledDate: app.interview.scheduledDate,
        scheduledTime: app.interview.scheduledTime,
        type: app.interview.type || 'offline',
        location: app.interview.location,
        meetingLink: app.interview.meetingLink,
        notes: app.interview.notes,
        result: app.interview.result || 'pending',
        scheduledBy: app.interview.scheduledBy || app.createdBy._id,
        createdBy: app.interview.scheduledBy || app.createdBy._id,
        scheduledAt: app.interview.scheduledAt || app.createdAt
      };

      // Set status based on application status
      if (app.status === 'interview_scheduled') {
        interviewData.status = 'scheduled';
      } else if (app.status === 'interview_completed') {
        interviewData.status = 'completed';
        interviewData.completedAt = app.interview.completedAt || new Date();
      }

      // Add interviewers if they exist
      if (app.interview.interviewers && app.interview.interviewers.length > 0) {
        interviewData.interviewers = app.interview.interviewers;
      }

      try {
        const newInterview = new Interview(interviewData);
        await newInterview.save();
        
        console.log(`   ✅ Migrated to Interview: ${newInterview.interviewNumber}`);
        migratedCount++;
      } catch (error) {
        console.log(`   ❌ Failed to migrate: ${error.message}`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total applications with interviews: ${applicationsWithInterviews.length}`);
    console.log(`   Successfully migrated: ${migratedCount}`);
    console.log(`   Skipped (already exists): ${skippedCount}`);
    console.log(`   Failed: ${applicationsWithInterviews.length - migratedCount - skippedCount}`);

    // Verify migration
    console.log('\n🔍 Verification:');
    const totalInterviews = await Interview.countDocuments();
    console.log(`   Total interviews in Interview model: ${totalInterviews}`);

    // Show some sample interviews
    const sampleInterviews = await Interview.find()
      .populate('application', 'applicationNumber')
      .limit(5)
      .sort({ createdAt: -1 });

    console.log('\n📋 Sample migrated interviews:');
    sampleInterviews.forEach(interview => {
      console.log(`   - ${interview.interviewNumber}: ${interview.application.applicationNumber} (${interview.status})`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the interview functionality in the frontend');
    console.log('2. Verify that rescheduling works correctly');
    console.log('3. Check the upcoming interviews page');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run migration
migrateInterviews();