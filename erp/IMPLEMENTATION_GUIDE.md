# Baithuzzakath API - Implementation Guide

## Quick Start Commands

### 1. Initialize the Project
```bash
mkdir baithuzkath-api
cd baithuzkath-api
npm init -y
```

### 2. Install Dependencies
```bash
# Core dependencies
npm install express mongoose cors helmet morgan compression
npm install jsonwebtoken bcryptjs joi dotenv
npm install multer gridfs-stream axios nodemailer
npm install express-rate-limit express-validator
npm install swagger-jsdoc swagger-ui-express

# Development dependencies
npm install -D nodemon jest supertest eslint prettier
npm install -D @types/node @types/express @types/jest
```

### 3. Project Structure Setup
```bash
mkdir -p src/{config,models,controllers,routes,middleware,services,utils}
mkdir -p tests/{unit,integration}
mkdir -p docs uploads logs
```

## Core Implementation Files

### 1. Package.json Scripts
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "docs": "node docs/generate.js"
  }
}
```

### 2. Environment Configuration (src/config/environment.js)
```javascript
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/baithuzzakath',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // DXing SMS Service
  DXING_API_KEY: process.env.DXING_API_KEY,
  DXING_SENDER_ID: process.env.DXING_SENDER_ID,
  DXING_OTP_TEMPLATE_ID: process.env.DXING_OTP_TEMPLATE_ID,
  DXING_NOTIFICATION_TEMPLATE_ID: process.env.DXING_NOTIFICATION_TEMPLATE_ID,
  
  // Email Service
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // File Upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10485760, // 10MB
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || 15,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100
};
```

### 3. Database Connection (src/config/database.js)
```javascript
const mongoose = require('mongoose');
const config = require('./environment');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 4. Main Application (src/app.js)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const config = require('./config/environment');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const schemeRoutes = require('./routes/schemes');
const applicationRoutes = require('./routes/applications');
const beneficiaryRoutes = require('./routes/beneficiaries');
const donorRoutes = require('./routes/donors');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const publicRoutes = require('./routes/public');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.NODE_ENV} mode`);
});

module.exports = app;
```

### 5. User Model (src/models/User.js)
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^[6-9]\d{9}$/
  },
  role: {
    type: String,
    enum: ['admin', 'beneficiary', 'coordinator'],
    default: 'beneficiary'
  },
  profile: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    address: {
      street: String,
      area: String,
      district: String,
      state: { type: String, default: 'Kerala' },
      pincode: String
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    occupation: String,
    annualIncome: Number
  },
  permissions: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  otpCode: String,
  otpExpiry: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ 'profile.email': 1 });
userSchema.index({ role: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Methods
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

userSchema.methods.verifyOTP = function(otp) {
  return this.otpCode === otp && this.otpExpiry > Date.now();
};

userSchema.methods.incrementLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);
```

### 6. Authentication Controller (src/controllers/authController.js)
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dxingSmsService = require('../services/dxingSmsService');
const config = require('../config/environment');
const { validationResult } = require('express-validator');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE
  });
};

// Send OTP
exports.sendOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { phone } = req.body;

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ 
        phone,
        profile: { name: '' } // Will be updated later
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many attempts'
      });
    }

    // Generate and save OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via DXing SMS
    await dxingSmsService.sendOTP(phone, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone,
        expiresIn: 10 // minutes
      }
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// Verify OTP and login
exports.verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      await user.incrementLoginAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Clear OTP and login attempts
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          phone: user.phone,
          role: user.role,
          profile: user.profile,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-otpCode -otpExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profile: { ...updates } } },
      { new: true, runValidators: true }
    ).select('-otpCode -otpExpiry');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};
```

### 7. Authentication Middleware (src/middleware/auth.js)
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/environment');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-otpCode -otpExpiry');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not active'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Check user role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Check specific permissions
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role === 'admin' || req.user.permissions.includes(permission)) {
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Access denied. Permission required: ' + permission
    });
  };
};
```

### 8. DXing SMS Service (src/services/dxingSmsService.js)
```javascript
const axios = require('axios');
const config = require('../config/environment');

class DXingSmsService {
  constructor() {
    this.baseURL = 'https://dxing.net/dxapi';
    this.apiKey = config.DXING_API_KEY;
    this.senderId = config.DXING_SENDER_ID;
  }

  async sendOTP(phone, otp) {
    try {
      const message = `Your Baithuzzakath Kerala verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
      
      const response = await axios.post(`${this.baseURL}/sms/send`, {
        api_key: this.apiKey,
        sender_id: this.senderId,
        mobile: phone,
        message: message,
        template_id: config.DXING_OTP_TEMPLATE_ID // DLT template ID for OTP
      });

      if (response.data.status === 'success') {
        console.log('OTP sent successfully via DXing:', response.data);
        return {
          success: true,
          messageId: response.data.message_id,
          credits: response.data.credits_used
        };
      } else {
        throw new Error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('DXing OTP sending failed:', error.response?.data || error.message);
      throw new Error('Failed to send OTP via DXing');
    }
  }

  async sendBulkSMS(recipients, message, templateId = null) {
    try {
      const response = await axios.post(`${this.baseURL}/sms/bulk`, {
        api_key: this.apiKey,
        sender_id: this.senderId,
        recipients: recipients, // Array of phone numbers
        message: message,
        template_id: templateId
      });

      if (response.data.status === 'success') {
        console.log('Bulk SMS sent successfully:', response.data);
        return {
          success: true,
          messageId: response.data.message_id,
          totalSent: response.data.total_sent,
          credits: response.data.credits_used
        };
      } else {
        throw new Error(response.data.message || 'Failed to send bulk SMS');
      }
    } catch (error) {
      console.error('DXing bulk SMS failed:', error.response?.data || error.message);
      throw new Error('Failed to send bulk SMS');
    }
  }

  async sendNotification(phone, message, templateId = null) {
    try {
      const response = await axios.post(`${this.baseURL}/sms/send`, {
        api_key: this.apiKey,
        sender_id: this.senderId,
        mobile: phone,
        message: message,
        template_id: templateId
      });

      if (response.data.status === 'success') {
        return {
          success: true,
          messageId: response.data.message_id,
          credits: response.data.credits_used
        };
      } else {
        throw new Error(response.data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('DXing notification failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async getDeliveryStatus(messageId) {
    try {
      const response = await axios.get(`${this.baseURL}/sms/status`, {
        params: {
          api_key: this.apiKey,
          message_id: messageId
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get delivery status:', error);
      throw error;
    }
  }

  async getBalance() {
    try {
      const response = await axios.get(`${this.baseURL}/account/balance`, {
        params: {
          api_key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }
}

module.exports = new DXingSmsService();
```

### 9. Error Handler Middleware (src/middleware/errorHandler.js)
```javascript
const config = require('../config/environment');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

### 10. Authentication Routes (src/routes/auth.js)
```javascript
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const phoneValidation = body('phone')
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Please provide a valid 10-digit Indian mobile number');

const otpValidation = body('otp')
  .isLength({ min: 6, max: 6 })
  .isNumeric()
  .withMessage('OTP must be a 6-digit number');

// Routes
router.post('/send-otp', [phoneValidation], authController.sendOTP);

router.post('/verify-otp', [
  phoneValidation,
  otpValidation
], authController.verifyOTP);

router.get('/profile', authenticate, authController.getProfile);

router.put('/profile', [
  authenticate,
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail()
], authController.updateProfile);

router.post('/logout', authenticate, authController.logout);

module.exports = router;
```

## Frontend Integration Updates

### 1. API Service Setup (src/services/api.js)
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth methods
  async sendOTP(phone) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: { phone },
    });
  }

  async verifyOTP(phone, otp) {
    const response = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp },
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: projectData,
    });
  }

  // Applications
  async getApplications(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`/applications${queryString ? `?${queryString}` : ''}`);
  }

  async submitApplication(applicationData) {
    return this.request('/applications', {
      method: 'POST',
      body: applicationData,
    });
  }

  // Public methods (no auth required)
  async getPublicSchemes() {
    return this.request('/public/schemes');
  }
}

export default new ApiService();
```

### 2. Update Authentication Pages
Replace the mock authentication in your React components with actual API calls:

```javascript
// In src/pages/Auth.tsx - Update handleVerifyOTP function
const handleVerifyOTP = async () => {
  if (otp.length !== 6) {
    toast({
      title: "Invalid OTP",
      description: "Please enter the 6-digit verification code",
      variant: "destructive",
    });
    return;
  }

  try {
    const response = await apiService.verifyOTP(phoneNumber, otp);
    
    toast({
      title: "Login Successful",
      description: "Welcome back!",
    });
    
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  } catch (error) {
    toast({
      title: "Login Failed",
      description: error.message,
      variant: "destructive",
    });
  }
};
```

## Testing Setup

### 1. Jest Configuration (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
```

### 2. Test Setup (tests/setup.js)
```javascript
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
```

### 3. Sample Test (tests/unit/auth.test.js)
```javascript
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Authentication', () => {
  describe('POST /api/auth/send-otp', () => {
    it('should send OTP for valid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '9876543210' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('OTP sent successfully');
    });

    it('should reject invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
```

### 11. Comprehensive Notification Service (src/services/notificationService.js)
```javascript
const dxingSmsService = require('./dxingSmsService');
const emailService = require('./emailService');
const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.templates = {
      otp: {
        sms: 'Your Baithuzzakath Kerala verification code is: {otp}. Valid for 10 minutes.',
        templateId: process.env.DXING_OTP_TEMPLATE_ID
      },
      application_submitted: {
        sms: 'Your application {applicationId} has been submitted successfully. Track status at baithuzzakath.org',
        email: {
          subject: 'Application Submitted - {applicationId}',
          body: 'Dear {name}, your application for {scheme} has been submitted successfully.'
        }
      },
      application_approved: {
        sms: 'Congratulations! Your application {applicationId} has been approved. Amount: Rs.{amount}',
        email: {
          subject: 'Application Approved - {applicationId}',
          body: 'Dear {name}, your application for {scheme} has been approved for Rs.{amount}.'
        }
      },
      application_rejected: {
        sms: 'Your application {applicationId} has been rejected. Reason: {reason}',
        email: {
          subject: 'Application Status - {applicationId}',
          body: 'Dear {name}, unfortunately your application has been rejected. Reason: {reason}'
        }
      },
      interview_scheduled: {
        sms: 'Interview scheduled for application {applicationId} on {date} at {time}. Venue: {venue}',
        email: {
          subject: 'Interview Scheduled - {applicationId}',
          body: 'Dear {name}, your interview is scheduled for {date} at {time}. Venue: {venue}'
        }
      },
      payment_processed: {
        sms: 'Payment of Rs.{amount} processed for application {applicationId}. Transaction ID: {transactionId}',
        email: {
          subject: 'Payment Processed - {applicationId}',
          body: 'Dear {name}, payment of Rs.{amount} has been processed. Transaction ID: {transactionId}'
        }
      },
      admin_new_application: {
        sms: 'New application {applicationId} received in your region. Scheme: {scheme}',
        push: {
          title: 'New Application',
          body: 'Application {applicationId} requires your review'
        }
      },
      admin_sla_alert: {
        sms: 'SLA Alert: Application {applicationId} is overdue by {days} days',
        push: {
          title: 'SLA Alert',
          body: 'Application {applicationId} requires urgent attention'
        }
      }
    };
  }

  async sendNotification(type, recipients, data, channels = ['sms']) {
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Notification template '${type}' not found`);
    }

    const results = [];

    for (const recipient of recipients) {
      for (const channel of channels) {
        try {
          let result;
          
          switch (channel) {
            case 'sms':
              result = await this.sendSMS(recipient, template, data);
              break;
            case 'email':
              result = await this.sendEmail(recipient, template, data);
              break;
            case 'push':
              result = await this.sendPushNotification(recipient, template, data);
              break;
            case 'in_app':
              result = await this.createInAppNotification(recipient, template, data);
              break;
          }

          results.push({
            recipient,
            channel,
            success: true,
            result
          });

        } catch (error) {
          console.error(`Failed to send ${channel} to ${recipient}:`, error);
          results.push({
            recipient,
            channel,
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  async sendSMS(phone, template, data) {
    if (!template.sms) {
      throw new Error('SMS template not defined');
    }

    const message = this.interpolateTemplate(template.sms, data);
    return await dxingSmsService.sendNotification(phone, message, template.templateId);
  }

  async sendEmail(email, template, data) {
    if (!template.email) {
      throw new Error('Email template not defined');
    }

    const subject = this.interpolateTemplate(template.email.subject, data);
    const body = this.interpolateTemplate(template.email.body, data);
    
    return await emailService.sendEmail(email, subject, body);
  }

  async sendPushNotification(userId, template, data) {
    if (!template.push) {
      throw new Error('Push template not defined');
    }

    const user = await User.findById(userId);
    if (!user?.deviceInfo?.fcmToken) {
      throw new Error('FCM token not found for user');
    }

    const title = this.interpolateTemplate(template.push.title, data);
    const body = this.interpolateTemplate(template.push.body, data);

    // Implement FCM push notification logic here
    // This would use Firebase Admin SDK
    return { success: true, title, body };
  }

  async createInAppNotification(userId, template, data) {
    const notification = new Notification({
      recipient: userId,
      application: data.applicationId,
      type: 'in_app',
      category: data.category || 'general',
      title: data.title || 'Notification',
      message: this.interpolateTemplate(template.sms || template.push?.body, data),
      priority: data.priority || 'medium',
      platform: 'web',
      metadata: {
        applicationId: data.applicationId,
        actionRequired: data.actionRequired || false,
        deepLink: data.deepLink,
        expiresAt: data.expiresAt
      }
    });

    return await notification.save();
  }

  async sendBulkNotification(type, userQuery, data, channels = ['sms']) {
    const users = await User.find(userQuery).select('phone profile.email _id deviceInfo.fcmToken');
    
    const recipients = users.map(user => ({
      userId: user._id,
      phone: user.phone,
      email: user.profile?.email,
      fcmToken: user.deviceInfo?.fcmToken
    }));

    const results = [];

    for (const channel of channels) {
      let channelRecipients;
      
      switch (channel) {
        case 'sms':
          channelRecipients = recipients.filter(r => r.phone).map(r => r.phone);
          if (channelRecipients.length > 0) {
            const template = this.templates[type];
            const message = this.interpolateTemplate(template.sms, data);
            const result = await dxingSmsService.sendBulkSMS(channelRecipients, message, template.templateId);
            results.push({ channel: 'sms', ...result });
          }
          break;
          
        case 'email':
          for (const recipient of recipients.filter(r => r.email)) {
            try {
              await this.sendEmail(recipient.email, this.templates[type], data);
            } catch (error) {
              console.error(`Failed to send email to ${recipient.email}:`, error);
            }
          }
          break;
          
        case 'push':
          // Implement bulk push notification
          break;
          
        case 'in_app':
          for (const recipient of recipients) {
            try {
              await this.createInAppNotification(recipient.userId, this.templates[type], data);
            } catch (error) {
              console.error(`Failed to create in-app notification for ${recipient.userId}:`, error);
            }
          }
          break;
      }
    }

    return results;
  }

  interpolateTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Predefined notification methods for common scenarios
  async notifyApplicationSubmitted(applicationId, userId, schemeTitle) {
    const user = await User.findById(userId);
    return await this.sendNotification('application_submitted', [user.phone], {
      applicationId,
      name: user.profile.name,
      scheme: schemeTitle
    }, ['sms', 'email']);
  }

  async notifyApplicationApproved(applicationId, userId, amount, schemeTitle) {
    const user = await User.findById(userId);
    return await this.sendNotification('application_approved', [user.phone], {
      applicationId,
      name: user.profile.name,
      scheme: schemeTitle,
      amount
    }, ['sms', 'email']);
  }

  async notifyAdminsNewApplication(applicationId, schemeTitle, regionQuery) {
    return await this.sendBulkNotification('admin_new_application', regionQuery, {
      applicationId,
      scheme: schemeTitle
    }, ['sms', 'push', 'in_app']);
  }

  async notifySLAAlert(applicationId, adminQuery, overdueDays) {
    return await this.sendBulkNotification('admin_sla_alert', adminQuery, {
      applicationId,
      days: overdueDays
    }, ['sms', 'push']);
  }
}

module.exports = new NotificationService();
```

### 12. Email Service (src/services/emailService.js)
```javascript
const nodemailer = require('nodemailer');
const config = require('../config/environment');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: false,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, body, isHtml = false) {
    try {
      const mailOptions = {
        from: `"Baithuzzakath Kerala" <${config.SMTP_USER}>`,
        to,
        subject,
        [isHtml ? 'html' : 'text']: body
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendBulkEmail(recipients, subject, body, isHtml = false) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(recipient, subject, body, isHtml);
        results.push({ recipient, success: true, messageId: result.messageId });
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new EmailService();
```

This implementation guide provides a solid foundation for building the Baithuzzakath API with DXing SMS integration. Start with the core authentication system and gradually add other features following the same patterns.