// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { activityLogger } = require('./middleware/activityLogger');

const connectDB = require('./config/database');
const config = require('./config/environment');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for serving static files
}));
app.use(cors({
  origin: config.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080']
    : config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Body parsing middleware - skip for multipart/form-data
app.use((req, res, next) => {
  const contentType = req.headers['content-type'];
  if (contentType && contentType.includes('multipart/form-data')) {
    return next(); // Skip body parsing for multipart
  }
  next();
});

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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Baithuzzakath API Documentation',
  explorer: true
}));

// API Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const smsRoutes = require('./routes/smsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
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
const uploadRoutes = require('./routes/uploadRoutes');
const regionalAdminRoutes = require('./routes/regionalAdminRoutes');
const mobileRoutes = require('./routes/mobileRoutes');

// Website Management Routes
const websiteRoutes = require('./routes/websiteRoutes');
const newsEventRoutes = require('./routes/newsEventRoutes');
const brochureRoutes = require('./routes/brochureRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/beneficiary', beneficiaryApiRoutes); // Beneficiary-specific API routes (must come before /api/beneficiaries)
app.use('/api/beneficiaries', beneficiaryRoutes); // Admin routes for beneficiary management
app.use('/api/regional-admin', regionalAdminRoutes); // Regional admin routes (unit, area, district admins)
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
app.use('/api/upload', uploadRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api', formConfigurationRoutes);

// Website Management Routes
app.use('/api/website', websiteRoutes);
app.use('/api/news-events', newsEventRoutes);
app.use('/api/brochures', brochureRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/banners', bannerRoutes);

// 404 handler for API routes - must come before static file serving
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Serve static files from frontend build directory (only in production)
if (config.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../../erp/dist');
  
  // Serve static assets (JS, CSS, images, etc.) with correct MIME types
  app.use(express.static(frontendBuildPath, {
    setHeaders: (res, filePath) => {
      // Ensure JavaScript files are served with correct MIME type
      // This fixes the "application/octet-stream" error
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      }
      // Ensure proper caching headers for static assets
      if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));
  
  // Serve favicon.ico from public directory (before SPA fallback)
  app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(__dirname, '../../erp/public/favicon.ico');
    res.sendFile(faviconPath, (err) => {
      if (err) {
        res.status(404).end();
      }
    });
  });
  
  // SPA fallback: serve index.html for all non-API routes (must be last)
  app.get('*', (req, res, next) => {
    // Skip API routes and health check
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    
    const indexPath = path.join(frontendBuildPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

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