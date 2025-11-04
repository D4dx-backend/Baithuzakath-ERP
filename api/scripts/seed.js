#!/usr/bin/env node

const mongoose = require('mongoose');
const SeedData = require('../src/utils/seedData');
const config = require('../src/config/environment');

/**
 * Database seeding script
 */
async function runSeed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'locations':
        await SeedData.seedLocations();
        break;
      case 'users':
        await SeedData.seedUsers();
        break;
      case 'projects':
        await SeedData.seedProjects();
        break;
      case 'schemes':
        await SeedData.seedSchemes();
        break;
      case 'beneficiaries':
        await SeedData.seedBeneficiaries();
        break;
      case 'applications':
        await SeedData.seedApplications();
        break;
      case 'interviews':
        await SeedData.seedInterviews();
        break;
      case 'clear':
        await SeedData.clearAll();
        break;
      case 'all':
      default:
        await SeedData.seedAll();
        break;
    }

    console.log('🎯 Seeding operation completed');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the seeding
runSeed();