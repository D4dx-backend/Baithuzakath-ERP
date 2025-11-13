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
  
  // Distribution Timeline (for installment payments)
  distributionTimeline: [{
    description: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    expectedDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    actualDate: Date,
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    notes: String
  }],

  // Application Workflow Stages (from scheme configuration)
  applicationStages: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    order: {
      type: Number,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    allowedRoles: [{
      type: String,
      enum: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin', 'project_coordinator', 'scheme_coordinator']
    }],
    autoTransition: {
      type: Boolean,
      default: false
    },
    transitionConditions: String,
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending'
    },
    notes: String
  }],

  // Current Stage in the workflow
  currentStage: {
    type: String,
    default: 'Application Received'
  },

  // Stage History for tracking
  stageHistory: [{
    stageName: String,
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
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

  // Interview History (tracks all schedule/reschedule changes)
  interviewHistory: [{
    scheduledDate: {
      type: Date,
      required: true
    },
    scheduledTime: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['offline', 'online'],
      required: true
    },
    location: String,
    meetingLink: String,
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scheduledAt: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['scheduled', 'rescheduled', 'cancelled'],
      default: 'scheduled'
    },
    reason: String
  }],
  
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