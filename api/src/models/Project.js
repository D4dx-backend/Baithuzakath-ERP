const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'Project code is required'],
    unique: true,
    uppercase: true,
    match: [/^[A-Z0-9_-]+$/, 'Project code can only contain uppercase letters, numbers, hyphens and underscores']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Project Classification
  category: {
    type: String,
    enum: ['education', 'healthcare', 'housing', 'livelihood', 'emergency_relief', 'infrastructure', 'social_welfare', 'other'],
    required: [true, 'Project category is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Geographic Scope
  scope: {
    type: String,
    enum: ['state', 'district', 'area', 'unit', 'multi_region'],
    required: [true, 'Project scope is required']
  },
  targetRegions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  }],
  
  // Timeline
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  // Financial Information
  budget: {
    total: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [0, 'Budget cannot be negative']
    },
    allocated: {
      type: Number,
      default: 0,
      min: [0, 'Allocated amount cannot be negative']
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Project Management
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project coordinator is required']
  },
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['coordinator', 'manager', 'supervisor', 'field_officer', 'volunteer']
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    permissions: [{
      type: String,
      enum: ['view', 'edit', 'approve', 'manage_team', 'manage_budget']
    }]
  }],
  
  // Status and Progress
  status: {
    type: String,
    enum: ['draft', 'approved', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'draft'
  },
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    milestones: [{
      name: String,
      description: String,
      targetDate: Date,
      completedDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'delayed'],
        default: 'pending'
      }
    }]
  },
  
  // Documents and Media
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['proposal', 'approval', 'budget', 'report', 'certificate', 'other']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Beneficiary Information
  targetBeneficiaries: {
    estimated: {
      type: Number,
      min: [0, 'Estimated beneficiaries cannot be negative']
    },
    actual: {
      type: Number,
      default: 0,
      min: [0, 'Actual beneficiaries cannot be negative']
    },
    demographics: {
      ageGroups: {
        children: { type: Number, default: 0 },
        youth: { type: Number, default: 0 },
        adults: { type: Number, default: 0 },
        elderly: { type: Number, default: 0 }
      },
      gender: {
        male: { type: Number, default: 0 },
        female: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      }
    }
  },
  
  // Approval Workflow
  approvals: [{
    level: {
      type: String,
      enum: ['district', 'state', 'board']
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: String,
    date: Date
  }],
  
  // Settings and Configuration
  settings: {
    allowPublicView: {
      type: Boolean,
      default: false
    },
    requireApprovalForApplications: {
      type: Boolean,
      default: true
    },
    maxApplicationsPerBeneficiary: {
      type: Number,
      default: 1,
      min: 1
    },
    autoAssignApplications: {
      type: Boolean,
      default: false
    }
  },
  
  // Audit Trail
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
projectSchema.index({ code: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ coordinator: 1 });
projectSchema.index({ targetRegions: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ 'budget.total': 1 });

// Virtual for budget utilization percentage
projectSchema.virtual('budgetUtilization').get(function() {
  if (this.budget.total === 0) return 0;
  return Math.round((this.budget.spent / this.budget.total) * 100);
});

// Virtual for remaining budget
projectSchema.virtual('remainingBudget').get(function() {
  return this.budget.total - this.budget.spent;
});

// Virtual for project duration in days
projectSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const today = new Date();
  const remaining = Math.ceil((this.endDate - today) / (1000 * 60 * 60 * 24));
  return remaining > 0 ? remaining : 0;
});

// Virtual for schemes count
projectSchema.virtual('schemesCount', {
  ref: 'Scheme',
  localField: '_id',
  foreignField: 'project',
  count: true
});

// Virtual for applications count
projectSchema.virtual('applicationsCount', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'project',
  count: true
});

// Method to check if user can access this project
projectSchema.methods.canUserAccess = function(user) {
  // Super admin and state admin can access all projects
  if (user.role === 'super_admin' || user.role === 'state_admin') return true;
  
  // Project coordinator can access assigned projects
  if (user.role === 'project_coordinator') {
    return user.adminScope?.projects?.some(projectId => 
      projectId.toString() === this._id.toString()
    ) || false;
  }
  
  // Other admins can access projects in their regions
  if (!user.adminScope?.regions || !this.targetRegions) return false;
  
  return this.targetRegions.some(regionId => 
    user.adminScope.regions.some(userRegionId => 
      userRegionId.toString() === regionId.toString()
    )
  );
};

// Method to update progress
projectSchema.methods.updateProgress = function() {
  const completedMilestones = this.progress.milestones.filter(
    milestone => milestone.status === 'completed'
  ).length;
  
  const totalMilestones = this.progress.milestones.length;
  
  if (totalMilestones > 0) {
    this.progress.percentage = Math.round((completedMilestones / totalMilestones) * 100);
  }
  
  return this.save();
};

// Pre-save validation
projectSchema.pre('save', function(next) {
  // Validate dates
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Validate budget
  if (this.budget.spent > this.budget.total) {
    return next(new Error('Spent amount cannot exceed total budget'));
  }
  
  if (this.budget.allocated > this.budget.total) {
    return next(new Error('Allocated amount cannot exceed total budget'));
  }
  
  next();
});

module.exports = mongoose.model('Project', projectSchema);