const mongoose = require('mongoose');
require('dotenv').config({ path: './baithuzkath-api/.env' });

// Import models
const Scheme = require('./baithuzkath-api/src/models/Scheme');
const FormConfiguration = require('./baithuzkath-api/src/models/FormConfiguration');
const User = require('./baithuzkath-api/src/models/User');

async function createDefaultForms() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find a system user to use as creator
    const systemUser = await User.findOne({ role: { $in: ['super_admin', 'state_admin'] } });
    if (!systemUser) {
      console.log('❌ No system user found to create form configurations');
      return;
    }
    console.log(`👤 Using system user: ${systemUser.name} (${systemUser._id})`);

    // Get all active schemes
    const activeSchemes = await Scheme.find({ status: 'active' });
    console.log(`📋 Found ${activeSchemes.length} active schemes`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const scheme of activeSchemes) {
      // Check if form configuration already exists
      const existingConfig = await FormConfiguration.findOne({ scheme: scheme._id });
      
      if (existingConfig) {
        console.log(`⏭️  Skipping ${scheme.name} - form configuration already exists`);
        skippedCount++;
        continue;
      }

      console.log(`📝 Creating form configuration for: ${scheme.name}`);

      // Create default form configuration
      const defaultFormConfig = new FormConfiguration({
        scheme: scheme._id,
        title: `${scheme.name} Application Form`,
        description: `Application form for ${scheme.name}. Please fill out all required fields to submit your application.`,
        enabled: true,
        isPublished: true,
        emailNotifications: true,
        allowDrafts: true,
        requiresReview: true,
        pages: [
          {
            id: 1,
            title: "Personal Information",
            description: "Please provide your basic personal details",
            fields: [
              {
                id: 1,
                label: "Full Name",
                type: "text",
                required: true,
                enabled: true,
                placeholder: "Enter your full name as per official documents",
                validation: {
                  minLength: 2,
                  maxLength: 100,
                  customMessage: "Please enter your full name (2-100 characters)"
                }
              },
              {
                id: 2,
                label: "Email Address",
                type: "email",
                required: true,
                enabled: true,
                placeholder: "your@email.com",
                helpText: "We'll use this email to communicate with you about your application"
              },
              {
                id: 3,
                label: "Phone Number",
                type: "phone",
                required: true,
                enabled: true,
                placeholder: "+91 XXXXXXXXXX",
                validation: {
                  pattern: "^[+]?[0-9]{10,15}$",
                  customMessage: "Please enter a valid phone number"
                }
              },
              {
                id: 4,
                label: "Date of Birth",
                type: "date",
                required: true,
                enabled: true,
                helpText: "Your date of birth as per official documents"
              },
              {
                id: 5,
                label: "Gender",
                type: "select",
                required: true,
                enabled: true,
                options: ["Male", "Female", "Other"]
              }
            ],
            order: 1
          },
          {
            id: 2,
            title: "Address Information",
            description: "Please provide your current address details",
            fields: [
              {
                id: 6,
                label: "House/Building Number",
                type: "text",
                required: true,
                enabled: true,
                placeholder: "Enter house/building number"
              },
              {
                id: 7,
                label: "Street/Area",
                type: "text",
                required: true,
                enabled: true,
                placeholder: "Enter street or area name"
              },
              {
                id: 8,
                label: "City/Town",
                type: "text",
                required: true,
                enabled: true,
                placeholder: "Enter city or town"
              },
              {
                id: 9,
                label: "District",
                type: "text",
                required: true,
                enabled: true,
                placeholder: "Enter district"
              },
              {
                id: 10,
                label: "PIN Code",
                type: "text",
                required: true,
                enabled: true,
                placeholder: "Enter 6-digit PIN code",
                validation: {
                  pattern: "^[0-9]{6}$",
                  customMessage: "Please enter a valid 6-digit PIN code"
                }
              }
            ],
            order: 2
          },
          {
            id: 3,
            title: "Application Details",
            description: "Please provide details about your application",
            fields: [
              {
                id: 11,
                label: "Purpose of Application",
                type: "textarea",
                required: true,
                enabled: true,
                placeholder: "Please describe the purpose of your application and how it aligns with the scheme objectives",
                validation: {
                  minLength: 50,
                  maxLength: 1000,
                  customMessage: "Please provide a detailed description (50-1000 characters)"
                }
              },
              {
                id: 12,
                label: "Annual Family Income",
                type: "number",
                required: true,
                enabled: true,
                placeholder: "Enter annual family income in rupees",
                helpText: "Please enter your total annual family income"
              },
              {
                id: 13,
                label: "Supporting Documents",
                type: "file",
                required: false,
                enabled: true,
                helpText: "Upload any supporting documents (PDF, JPG, PNG - Max 5MB each)"
              }
            ],
            order: 3
          }
        ],
        submissionSettings: {
          confirmationMessage: "Thank you for your application. We will review it and get back to you soon.",
          notificationEmails: []
        },
        createdBy: systemUser._id,
        updatedBy: systemUser._id,
        version: 1
      });

      await defaultFormConfig.save();
      
      // Update scheme to mark it as having form configuration
      await Scheme.findByIdAndUpdate(scheme._id, {
        hasFormConfiguration: true,
        formConfigurationUpdated: new Date()
      });

      console.log(`✅ Created form configuration for: ${scheme.name}`);
      createdCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${createdCount} form configurations`);
    console.log(`⏭️  Skipped: ${skippedCount} schemes (already had forms)`);
    console.log(`📋 Total processed: ${activeSchemes.length} schemes`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

createDefaultForms();