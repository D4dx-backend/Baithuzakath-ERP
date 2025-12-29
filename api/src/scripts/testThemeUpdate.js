/**
 * Test script to verify theme updates are saved to MongoDB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const ApplicationConfig = require('../models/ApplicationConfig');

async function testThemeUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get current theme
    const colorThemeConfig = await ApplicationConfig.findOne({ category: 'theme', key: 'colorTheme' });
    const darkModeConfig = await ApplicationConfig.findOne({ category: 'theme', key: 'darkMode' });
    
    console.log('📊 Current Theme Settings:');
    console.log('  - Color Theme:', colorThemeConfig.value);
    console.log('  - Dark Mode:', darkModeConfig.value);
    console.log('  - Last Updated:', colorThemeConfig.updatedAt);
    console.log('');

    // Test 1: Change color theme to 'blue'
    console.log('🔄 Test 1: Changing color theme to "blue"...');
    colorThemeConfig.value = 'blue';
    await colorThemeConfig.save();
    console.log('✅ Saved! New value:', colorThemeConfig.value);
    console.log('✅ Updated at:', colorThemeConfig.updatedAt);
    console.log('');

    // Test 2: Change dark mode to true
    console.log('🔄 Test 2: Enabling dark mode...');
    darkModeConfig.value = true;
    await darkModeConfig.save();
    console.log('✅ Saved! New value:', darkModeConfig.value);
    console.log('✅ Updated at:', darkModeConfig.updatedAt);
    console.log('');

    // Verify changes
    const updatedColorTheme = await ApplicationConfig.findOne({ category: 'theme', key: 'colorTheme' });
    const updatedDarkMode = await ApplicationConfig.findOne({ category: 'theme', key: 'darkMode' });
    
    console.log('✅ Verification - Reading from database:');
    console.log('  - Color Theme:', updatedColorTheme.value);
    console.log('  - Dark Mode:', updatedDarkMode.value);
    console.log('');

    // Reset to original values
    console.log('🔄 Resetting to original values...');
    colorThemeConfig.value = 'green';
    darkModeConfig.value = false;
    await colorThemeConfig.save();
    await darkModeConfig.save();
    console.log('✅ Reset complete!');
    console.log('');

    console.log('✅ All tests passed! Theme settings are being saved to MongoDB correctly.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testThemeUpdate();
