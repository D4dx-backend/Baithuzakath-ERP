const mongoose = require('mongoose');
require('dotenv').config({ path: './baithuzkath-api/.env' });

// Import models
const Scheme = require('./baithuzkath-api/src/models/Scheme');
const FormConfiguration = require('./baithuzkath-api/src/models/FormConfiguration');

async function checkFormConfigurations() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Check all schemes
    console.log('\n📋 Checking all schemes...');
    const schemes = await Scheme.find({}).select('_id name status hasFormConfiguration');
    console.log(`Found ${schemes.length} schemes total`);

    // Check active schemes
    const activeSchemes = schemes.filter(s => s.status === 'active');
    console.log(`Found ${activeSchemes.length} active schemes`);

    console.log('\n📊 Active Schemes:');
    activeSchemes.forEach((scheme, index) => {
      console.log(`${index + 1}. ${scheme.name} (${scheme._id})`);
      console.log(`   Status: ${scheme.status}`);
      console.log(`   Has Form Config Flag: ${scheme.hasFormConfiguration}`);
    });

    // Check FormConfiguration collection
    console.log('\n📝 Checking FormConfiguration collection...');
    const formConfigs = await FormConfiguration.find({})
      .populate('scheme', 'name status')
      .select('scheme title enabled isPublished pages');
    
    console.log(`Found ${formConfigs.length} form configurations total`);

    if (formConfigs.length > 0) {
      console.log('\n📋 Form Configurations:');
      formConfigs.forEach((config, index) => {
        console.log(`${index + 1}. ${config.title}`);
        console.log(`   Scheme: ${config.scheme?.name || 'Unknown'} (${config.scheme?._id})`);
        console.log(`   Scheme Status: ${config.scheme?.status || 'Unknown'}`);
        console.log(`   Enabled: ${config.enabled}`);
        console.log(`   Published: ${config.isPublished}`);
        console.log(`   Pages: ${config.pages?.length || 0}`);
        if (config.pages && config.pages.length > 0) {
          console.log(`   Page Titles: ${config.pages.map(p => p.title).join(', ')}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No form configurations found in database');
    }

    // Check specific scheme
    const targetSchemeId = '68f4a65ffbe20844c73fad8e';
    console.log(`\n🎯 Checking specific scheme: ${targetSchemeId}`);
    
    const targetScheme = await Scheme.findById(targetSchemeId);
    if (targetScheme) {
      console.log(`✅ Scheme found: ${targetScheme.name}`);
      console.log(`   Status: ${targetScheme.status}`);
      console.log(`   Has Form Config Flag: ${targetScheme.hasFormConfiguration}`);
      
      const targetFormConfig = await FormConfiguration.findOne({ scheme: targetSchemeId });
      if (targetFormConfig) {
        console.log(`✅ Form configuration found for this scheme`);
        console.log(`   Title: ${targetFormConfig.title}`);
        console.log(`   Enabled: ${targetFormConfig.enabled}`);
        console.log(`   Published: ${targetFormConfig.isPublished}`);
        console.log(`   Pages: ${targetFormConfig.pages?.length || 0}`);
      } else {
        console.log(`❌ No form configuration found for this scheme`);
      }
    } else {
      console.log(`❌ Scheme not found with ID: ${targetSchemeId}`);
    }

    // Check for schemes without form configurations
    console.log('\n🔍 Checking for active schemes without form configurations...');
    const schemesWithoutForms = [];
    
    for (const scheme of activeSchemes) {
      const formConfig = await FormConfiguration.findOne({ scheme: scheme._id });
      if (!formConfig) {
        schemesWithoutForms.push(scheme);
      }
    }

    if (schemesWithoutForms.length > 0) {
      console.log(`❌ Found ${schemesWithoutForms.length} active schemes without form configurations:`);
      schemesWithoutForms.forEach((scheme, index) => {
        console.log(`${index + 1}. ${scheme.name} (${scheme._id})`);
      });
    } else {
      console.log('✅ All active schemes have form configurations');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

checkFormConfigurations();