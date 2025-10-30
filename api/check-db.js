const mongoose = require('mongoose');
require('dotenv').config();

// Simple schema definitions for checking
const schemeSchema = new mongoose.Schema({}, { collection: 'schemes' });
const formConfigSchema = new mongoose.Schema({}, { collection: 'formconfigurations' });

const Scheme = mongoose.model('Scheme', schemeSchema);
const FormConfig = mongoose.model('FormConfiguration', formConfigSchema);

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Check schemes
    const schemes = await Scheme.find({ status: 'active' }).select('_id name status hasFormConfiguration');
    console.log(`\n📋 Found ${schemes.length} active schemes:`);
    schemes.forEach((scheme, i) => {
      console.log(`${i+1}. ${scheme.name} (${scheme._id}) - hasFormConfig: ${scheme.hasFormConfiguration}`);
    });

    // Check form configurations
    const formConfigs = await FormConfig.find({}).select('scheme title enabled isPublished');
    console.log(`\n📝 Found ${formConfigs.length} form configurations:`);
    formConfigs.forEach((config, i) => {
      console.log(`${i+1}. ${config.title} - Scheme: ${config.scheme} - Enabled: ${config.enabled} - Published: ${config.isPublished}`);
    });

    // Check specific scheme
    const targetId = '68f4a65ffbe20844c73fad8e';
    const targetScheme = await Scheme.findById(targetId);
    const targetFormConfig = await FormConfig.findOne({ scheme: targetId });
    
    console.log(`\n🎯 Target scheme (${targetId}):`);
    console.log(`Scheme exists: ${!!targetScheme}`);
    if (targetScheme) {
      console.log(`Name: ${targetScheme.name}`);
      console.log(`Status: ${targetScheme.status}`);
      console.log(`hasFormConfiguration: ${targetScheme.hasFormConfiguration}`);
    }
    console.log(`Form config exists: ${!!targetFormConfig}`);
    if (targetFormConfig) {
      console.log(`Form title: ${targetFormConfig.title}`);
      console.log(`Form enabled: ${targetFormConfig.enabled}`);
      console.log(`Form published: ${targetFormConfig.isPublished}`);
      console.log(`Form pages: ${targetFormConfig.pages?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();