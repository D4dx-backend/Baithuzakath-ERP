// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { activityLogger } = require('./middleware/activityLogger');

const connectDB = require('./config/database');
const config = require('./config/environment');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080']
    : config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
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

// Activity logging middleware for all routes
app.use(activityLogger({
  skipEndpoints: ['/api/activity-logs'],
  includeResponseData: false
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Baithuzzakath API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: '1.0.0'
  });
});

// API Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const smsRoutes = require('./routes/smsRoutes');
const projectRoutes = require('./routes/projectRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const locationRoutes = require('./routes/locationRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const beneficiaryApiRoutes = require('./routes/beneficiaryRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const formConfigurationRoutes = require('./routes/formConfigurationRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const donorRoutes = require('./routes/donorRoutes');
const donationRoutes = require('./routes/donationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');
const rbacRoutes = require('./routes/rbacRoutes');
const activityLogRoutes = require('./routes/activityLogs');
const masterDataRoutes = require('./routes/masterDataRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/beneficiary', beneficiaryApiRoutes); // New beneficiary-specific API routes
app.use('/api/applications', applicationRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api', formConfigurationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${config.NODE_ENV} mode`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 JWT Secret loaded: ${config.JWT_SECRET ? 'YES' : 'NO'}`);
  console.log(`🔑 JWT Secret (first 10 chars): ${config.JWT_SECRET ? config.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET'}`);
});

module.exports = app;