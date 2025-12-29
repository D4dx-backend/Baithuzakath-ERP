/**
 * Seed script for Application Configuration
 * Creates initial configuration documents in the database
 * 
 * Run with: node src/scripts/seedApplicationConfig.js
 */

const mongoose = require('mongoose');
const ApplicationConfig = require('../models/ApplicationConfig');
require('dotenv').config();

const configs = [
  // Theme Configurations
  {
    category: 'theme',
    key: 'colorTheme',
    value: 'green',
    label: 'Color Theme',
    description: 'Primary color theme for the application',
    dataType: 'string',
    validation: {
      enum: ['blue', 'purple', 'green']
    },
    scope: 'global',
    isEditable: true,
    requiredPermission: 'config.write'
  },
  {
    category: 'theme',
    key: 'darkMode',
    value: false,
    label: 'Dark Mode',
    description: 'Enable dark mode theme',
    dataType: 'boolean',
    scope: 'global',
    isEditable: true,
    requiredPermission: 'config.write'
  },
  
  // Menu Configurations
  {
    category: 'menu',
    key: 'menuStyle',
    value: 'comfortable',
    label: 'Menu Style',
    description: 'Spacing style for menu items',
    dataType: 'string',
    validation: {
      enum: ['compact', 'comfortable', 'spacious']
    },
    scope: 'global',
    isEditable: true,
    requiredPermission: 'config.write'
  },
  {
    category: 'menu',
    key: 'sidebarSearchEnabled',
    value: true,
    label: 'Sidebar Search',
    description: 'Enable search functionality in sidebar',
    dataType: 'boolean',
    scope: 'global',
    isEditable: true,
    requiredPermission: 'config.write'
  },
  {
    category: 'menu',
    key: 'sidebarPosition',
    value: 'left',
    label: 'Sidebar Position',
    description: 'Position of the sidebar',
    dataType: 'string',
    validation: {
      enum: ['left', 'right']
    },
    scope: 'global',
    isEditable: true,
    requiredPermission: 'config.write'
  },
  
  // Feature Configurations
  {
    category: 'features',
    key: 'commandPaletteEnabled',
    value: true,
    label: 'Command Palette',
    description: 'Enable command palette (Ctrl+K)',
    dataType: 'boolean',
    scope: 'global',
    isEditable: true,
    requiredPermission: 'config.write'
  },
  {
    category: 'features',
    key: 'notificationsEnabled',
    value: true,
    label: 'Notifications',
    description: 'Enable in-app notifications',
    dataType: 'boolean',
    scope: 'global',
    isEditable: true,
    requiredPermission: 'config.write'
  },
  {
    category: 'features',
    key: 'activityLoggingEnabled',
    value: true,
    label: 'Activity Logging',
    description: 'Enable activity logging for audit trail',
    dataType: 'boolean',
    scope: 'global',
    isEditable: true,
    requiredPermission: 'config.write'
  }
];

async function seedConfigs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Upsert configurations (update if exists, insert if not)
    let createdCount = 0;
    let updatedCount = 0;

    for (const config of configs) {
      const result = await ApplicationConfig.updateOne(
        { category: config.category, key: config.key },
        { $set: config },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        createdCount++;
        console.log(`✅ Created: ${config.category}.${config.key}`);
      } else if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`🔄 Updated: ${config.category}.${config.key}`);
      } else {
        console.log(`⏭️  Skipped: ${config.category}.${config.key} (no changes)`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${createdCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Total configs: ${configs.length}`);
    console.log('\n✅ Seeding completed successfully!');

    // Display current configurations
    const allConfigs = await ApplicationConfig.find().sort({ category: 1, key: 1 });
    console.log('\n📋 Current Application Configurations:');
    console.log('=====================================');
    
    const groupedConfigs = allConfigs.reduce((acc, config) => {
      if (!acc[config.category]) acc[config.category] = [];
      acc[config.category].push(config);
      return acc;
    }, {});

    Object.entries(groupedConfigs).forEach(([category, configs]) => {
      console.log(`\n${category.toUpperCase()}:`);
      configs.forEach(config => {
        console.log(`  - ${config.key}: ${JSON.stringify(config.value)} (${config.dataType})`);
      });
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding configurations:', error);
    process.exit(1);
  }
}

// Run the seeder
seedConfigs();
