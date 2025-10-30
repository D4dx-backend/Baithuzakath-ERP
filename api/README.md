# Baithuzzakath Kerala - Backend API

A comprehensive NGO management system for transparent Zakat distribution with hierarchical admin structure, mobile applications, and DXing SMS integration.

## 🚀 Features

- **Multi-level Authentication**: OTP-based authentication with DXing SMS integration
- **Hierarchical Access Control**: State → District → Area → Unit admin structure
- **Application Management**: Multi-level approval workflow with field verification
- **Real-time Notifications**: SMS, Email, Push, and In-app notifications
- **Payment Processing**: Multi-phase payment tracking and reconciliation
- **Mobile API Support**: Optimized endpoints for mobile applications
- **Comprehensive Reporting**: Role-based dashboards and analytics
- **Document Management**: File upload and verification system

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + OTP via DXing SMS API
- **Notifications**: DXing SMS + Nodemailer + Firebase FCM
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, Rate limiting

### Project Structure
```
baithuzkath-api/
├── src/
│   ├── config/          # Database and environment configuration
│   ├── controllers/     # API endpoint handlers
│   ├── middleware/      # Authentication, validation, error handling
│   ├── models/          # MongoDB schemas (10 models)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic services
│   └── utils/           # Helper functions and utilities
├── scripts/             # Database seeding and utility scripts
├── tests/               # Unit and integration tests
└── docs/                # API documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- DXing SMS API account
- SMTP email service

### 1. Clone and Install
```bash
git clone <repository-url>
cd baithuzkath-api
npm install
```

### 2. Environment Configuration
Create `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5001
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/baithuzzakath
MONGODB_TEST_URI=mongodb://localhost:27017/baithuzzakath_test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# DXing SMS Service
DXING_API_KEY=your-dxing-api-key
DXING_SENDER_ID=BZKRLA
DXING_OTP_TEMPLATE_ID=your-otp-template-id
DXING_NOTIFICATION_TEMPLATE_ID=your-notification-template-id

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### 3. Database Setup
```bash
# Seed initial data (locations and admin users)
npm run seed

# Or seed individually
npm run seed:locations
npm run seed:users

# Clear all data (for testing)
npm run seed:clear
```

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5001`

## 📚 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication Endpoints

#### Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "purpose": "login"
}
```

#### Verify OTP & Login
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456",
  "purpose": "login"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

### User Management Endpoints

#### Get Users
```http
GET /api/users?page=1&limit=10&role=district_admin
Authorization: Bearer <access_token>
```

#### Create User
```http
POST /api/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass@123",
  "role": "unit_admin",
  "adminScope": {
    "level": "unit",
    "regions": ["location_id"]
  }
}
```

### Health Check
```http
GET /health
```

## 🔐 Authentication & Authorization

### User Roles Hierarchy
```
State Admin (Full Kerala Access)
├── Project Coordinator (Cross-regional, project-specific)
├── Scheme Coordinator (Cross-regional, scheme-specific)  
├── District Admin (District-level only)
│   ├── Area Admin (Area-level only)
│   │   └── Unit Admin (Unit-level only)
│   └── Area Admin (Another area)
│       └── Unit Admin
└── Beneficiary (Application submission & tracking)
```

### JWT Token Structure
```json
{
  "userId": "user_id",
  "email": "user@example.com",
  "phone": "9876543210",
  "role": "district_admin",
  "adminScope": {
    "level": "district",
    "regions": ["region_id"]
  }
}
```

## 📱 DXing SMS Integration

### Setup Requirements
1. Register at [DXing.net](https://dxing.net)
2. Generate API key from dashboard
3. Register sender ID "BZKRLA"
4. Create DLT-compliant message templates
5. Add SMS credits to account

### SMS Templates
- **OTP**: `Dear {name}, your OTP for Baithuzzakath Kerala is {otp}. Valid for {validity}. Do not share with anyone.`
- **Welcome**: `Welcome to Baithuzzakath Kerala, {name}! Your account has been created successfully.`
- **Application Status**: `Dear {name}, your application {applicationNumber} status: {status}.`

## 🗄️ Database Models

### Core Models (10 implemented)
1. **User** - Authentication and user management
2. **Location** - Kerala administrative hierarchy
3. **Project** - Project management and tracking
4. **Scheme** - Scheme configuration and rules
5. **Beneficiary** - Beneficiary profiles and KYC
6. **Application** - Application workflow and tracking
7. **EnquiryReport** - Field verification reports
8. **Notification** - Multi-channel notifications
9. **Payment** - Payment processing and tracking
10. **Dashboard** - Custom dashboard configurations

### Location Hierarchy
```
Kerala (State)
├── Thiruvananthapuram (District)
│   ├── Thiruvananthapuram City (Area)
│   │   ├── Pettah Unit
│   │   ├── Fort Unit
│   │   └── Palayam Unit
│   ├── Neyyattinkara (Area)
│   ├── Varkala (Area)
│   └── Attingal (Area)
├── Kollam (District)
├── Ernakulam (District)
└── ... (14 districts total)
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run seed         # Seed all data
npm run seed:clear   # Clear all data
```

### Default Login Credentials (After Seeding)
```
State Admin:     admin@baithuzzakath.org / Admin@123
District Admin:  district.tvm@baithuzzakath.org / Admin@123
Area Admin:      area.tvmcity@baithuzzakath.org / Admin@123
Unit Admin:      unit.pettah@baithuzzakath.org / Admin@123
Beneficiary:     beneficiary@example.com / User@123
```

### Code Style & Standards
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Joi**: Request validation
- **JSDoc**: Function documentation
- **Error Handling**: Centralized error middleware
- **Logging**: Structured logging with file output

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=auth
```

### Test Structure
```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for API endpoints
├── fixtures/       # Test data and fixtures
└── helpers/        # Test helper functions
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/baithuzzakath
JWT_SECRET=production-secret-key
DXING_API_KEY=production-dxing-key
# ... other production configs
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### PM2 Process Management
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/app.js --name "baithuzzakath-api"

# Monitor
pm2 monit

# Logs
pm2 logs baithuzzakath-api
```

## 📊 Monitoring & Logging

### Log Levels
- **ERROR**: System errors and exceptions
- **WARN**: Warning messages and potential issues
- **INFO**: General information and request logs
- **DEBUG**: Detailed debugging information

### Log Files
- **Application Logs**: `./logs/app.log`
- **Error Logs**: Separate error logging
- **Request Logs**: HTTP request/response logging
- **Database Logs**: MongoDB operation logging

## 🔒 Security Features

### Implemented Security Measures
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Request rate limiting per IP
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers
- **Account Locking**: Failed login attempt protection
- **OTP Security**: Time-limited OTP with attempt limits

### Security Best Practices
- Environment variables for sensitive data
- Input sanitization and validation
- SQL injection prevention (NoSQL)
- XSS protection
- CSRF protection
- Secure cookie handling

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed

## 📞 Support

### Getting Help
- **Documentation**: Check this README and API docs
- **Issues**: Create GitHub issue for bugs
- **Email**: support@baithuzzakath.org
- **Phone**: +91-XXXX-XXXX-XX

### Troubleshooting

#### Common Issues
1. **MongoDB Connection Failed**
   - Check MongoDB service is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **DXing SMS Not Working**
   - Verify API key and credentials
   - Check SMS credits balance
   - Validate phone number format

3. **JWT Token Errors**
   - Check JWT_SECRET in environment
   - Verify token expiration settings
   - Clear browser cookies/storage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **DXing SMS Service** for reliable SMS delivery
- **MongoDB** for flexible document database
- **Express.js** for robust web framework
- **Kerala Government** for administrative data structure

---

**Baithuzzakath Kerala** - Transparent Zakat Distribution System
Version 1.0.0 | Built with ❤️ for the community