const ApplicationConfig = require('../models/ApplicationConfig');
const mongoose = require('mongoose');

async function testPublicConfig() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzakath');
    console.log('✅ Connected to MongoDB');

    const configs = await ApplicationConfig.find({
      scope: 'global',
      isEditable: true
    }).select('category key value label dataType -_id');

    console.log('\n📊 Found', configs.length, 'configs\n');

    const configMap = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = {};
      }
      acc[config.category][config.key] = config.value;
      return acc;
    }, {});

    console.log(JSON.stringify({ config: configMap }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPublicConfig();
