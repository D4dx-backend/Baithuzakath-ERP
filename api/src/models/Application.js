const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Application Details
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Beneficiary
  beneficiary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary',
    required: true
  },
  
  // Scheme
  scheme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scheme',
    required: true
  },
  
  // Project (if applicable)
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  
  // Application Status
  status: {
    type: String,
    enum: [
      'pending', 'under_review', 'field_verification', 
      'interview_scheduled', 'interview_completed', 'approved', 
      'rejected', 'on_hold', 'cancelled', 'disbursed', 'completed'
    ],
    default: 'pending'
  },
  
  // Amount
  requestedAmount: {
    type: Number,
    required: true
  },
  approvedAmount: {
    type: Number,
    default: 0
  },
  
  // Documents
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Review Information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
    type: String
  },
  
  // Approval Information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  approvalComments: {
    type: String
  },
  
  // Interview Information
  interview: {
    scheduledDate: {
      type: Date
    },
    scheduledTime: {
      type: String
    },
    type: {
      type: String,
      enum: ['offline', 'online'],
      default: 'offline'
    },
    location: {
      type: String
    },
    meetingLink: {
      type: String
    },
    interviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scheduledAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    notes: {
      type: String
    },
    result: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending'
    }
  },
  
  // Location Information (inherited from beneficiary)
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
applicationSchema.index({ applicationNumber: 1 });
applicationSchema.index({ beneficiary: 1 });
applicationSchema.index({ scheme: 1 });
applicationSchema.index({ project: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ state: 1, district: 1, area: 1, unit: 1 });
applicationSchema.index({ createdAt: -1 });

// Pre-save middleware to generate application number
applicationSchema.pre('save', async function(next) {
  if (this.isNew && !this.applicationNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.applicationNumber = `APP${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);