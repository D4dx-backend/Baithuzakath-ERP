const mongoose = require('mongoose');
require('dotenv').config();

// Import the FormConfiguration model
const FormConfiguration = require('./src/models/FormConfiguration');

async function fixPublishedForms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all form configurations that are enabled but not published
    const unpublishedForms = await FormConfiguration.find({
      enabled: true,
      $or: [
        { isPublished: { $exists: false } },
        { isPublished: false }
      ]
    });

    console.log(`📋 Found ${unpublishedForms.length} unpublished forms`);

    if (unpublishedForms.length > 0) {
      // Update all to be published
      const result = await FormConfiguration.updateMany(
        {
          enabled: true,
          $or: [
            { isPublished: { $exists: false } },
            { isPublished: false }
          ]
        },
        {
          $set: {
            isPublished: true,
            publishedAt: new Date()
          }
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} form configurations to published status`);
    } else {
      console.log('✅ All enabled forms are already published');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

fixPublishedForms();