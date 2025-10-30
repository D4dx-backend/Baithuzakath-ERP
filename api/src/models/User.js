const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: false, // Email is now optional for OTP-only authentication
    unique: true,
    sparse: true, // Allow multiple null values
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number']
  },
  // Password removed - OTP-only authentication
  // Legacy password field for data migration (will be removed)
  password: {
    type: String,
    select: false,
    default: null
  },

  // Role and Permissions - Multi-layer hierarchy
  role: {
    type: String,
    enum: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin', 'project_coordinator', 'scheme_coordinator', 'beneficiary'],
    required: [true, 'Role is required']
  },

  // Administrative Scope (for admins) - Enhanced multi-layer structure
  adminScope: {
    level: {
      type: String,
      enum: ['super', 'state', 'district', 'area', 'unit', 'project', 'scheme'],
      required: function () { return this.role !== 'beneficiary'; }
    },
    // Geographic regions under administration
    regions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    }],
    // Projects under administration
    projects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    }],
    // Schemes under administration
    schemes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme'
    }],
    // Hierarchical permissions
    permissions: {
      canCreateUsers: { type: Boolean, default: false },
      canManageProjects: { type: Boolean, default: false },
      canManageSchemes: { type: Boolean, default: false },
      canApproveApplications: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
      canManageFinances: { type: Boolean, default: false }
    }
  },

  // Profile Information
  profile: {
    avatar: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    address: {
      street: String,
      area: String,
      district: String,
      state: { type: String, default: 'Kerala' },
      pincode: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    }
  },

  // Authentication
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,

  // OTP Management - Enhanced for OTP-only authentication
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
    lastSentAt: Date,
    purpose: {
      type: String,
      enum: ['login', 'registration', 'password_reset', 'phone_verification'],
      default: 'login'
    },
    verified: { type: Boolean, default: false }
  },

  // Device Registration (for push notifications)
  devices: [{
    deviceId: String,
    fcmToken: String,
    platform: { type: String, enum: ['android', 'ios', 'web'] },
    lastActive: Date
  }],

  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'adminScope.regions': 1 });
userSchema.index({ isActive: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware - Password hashing removed for OTP-only auth
userSchema.pre('save', async function (next) {
  // Legacy password hashing for migration purposes only
  if (this.password && this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Legacy method - kept for backward compatibility during migration
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to check if user has access to region
userSchema.methods.hasRegionAccess = function (regionId) {
  if (this.role === 'state_admin') return true;
  return this.adminScope.regions.some(region => region.toString() === regionId.toString());
};

// Method to check if user has access to project
userSchema.methods.hasProjectAccess = function (projectId) {
  if (this.role === 'super_admin' || this.role === 'state_admin') return true;
  if (this.role === 'project_coordinator') {
    return this.adminScope.projects.some(project => project.toString() === projectId.toString());
  }
  return false;
};

// Method to check role hierarchy permissions
userSchema.methods.canManageRole = function (targetRole) {
  const roleHierarchy = {
    super_admin: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin', 'project_coordinator', 'scheme_coordinator', 'beneficiary'],
    state_admin: ['district_admin', 'area_admin', 'unit_admin', 'project_coordinator', 'scheme_coordinator', 'beneficiary'],
    district_admin: ['area_admin', 'unit_admin', 'beneficiary'],
    area_admin: ['unit_admin', 'beneficiary'],
    unit_admin: ['beneficiary'],
    project_coordinator: [],
    scheme_coordinator: [],
    beneficiary: []
  };
  
  const managableRoles = roleHierarchy[this.role] || [];
  return managableRoles.includes(targetRole);
};

// Method to get user's administrative level
userSchema.methods.getAdminLevel = function () {
  const levels = {
    super_admin: 0,
    state_admin: 1,
    district_admin: 2,
    area_admin: 3,
    unit_admin: 4,
    project_coordinator: 5,
    scheme_coordinator: 5,
    beneficiary: 6
  };
  return levels[this.role] || 6;
};

// Method to check if user can access another user's data
userSchema.methods.canAccessUser = function (targetUser) {
  // Super admin and state admin can access everyone
  if (this.role === 'super_admin' || this.role === 'state_admin') return true;
  
  // Users can access their own data
  if (this._id.toString() === targetUser._id.toString()) return true;
  
  // Check role hierarchy
  if (!this.canManageRole(targetUser.role)) return false;
  
  // Check regional access for geographic roles
  if (['district_admin', 'area_admin', 'unit_admin'].includes(this.role)) {
    if (!targetUser.adminScope?.regions) return true;
    
    return targetUser.adminScope.regions.some(regionId =>
      this.adminScope?.regions?.some(userRegion =>
        userRegion.toString() === regionId.toString()
      )
    );
  }
  
  return false;
};

// Method to generate and set OTP
userSchema.methods.generateOTP = function (purpose = 'login') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  this.otp = {
    code: otp,
    expiresAt,
    attempts: (this.otp?.attempts || 0) + 1,
    lastSentAt: new Date(),
    purpose,
    verified: false
  };
  
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function (inputOTP, purpose = 'login') {
  if (!this.otp.code || !this.otp.expiresAt) {
    return { success: false, message: 'No OTP found' };
  }
  
  if (this.otp.expiresAt < new Date()) {
    return { success: false, message: 'OTP has expired' };
  }
  
  if (this.otp.purpose !== purpose) {
    return { success: false, message: 'OTP purpose mismatch' };
  }
  
  if (this.otp.code !== inputOTP) {
    return { success: false, message: 'Invalid OTP' };
  }
  
  // Mark OTP as verified
  this.otp.verified = true;
  return { success: true, message: 'OTP verified successfully' };
};

// Method to clear OTP
userSchema.methods.clearOTP = function () {
  this.otp = {
    code: null,
    expiresAt: null,
    attempts: 0,
    lastSentAt: null,
    purpose: 'login',
    verified: false
  };
};

module.exports = mongoose.model('User', userSchema);