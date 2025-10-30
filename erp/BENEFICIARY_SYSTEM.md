# Beneficiary Application System

A mobile-first system that allows beneficiaries to access and apply for schemes using just their mobile number and OTP authentication.

## Features

### 🔐 Mobile OTP Authentication
- **Password-free login**: Beneficiaries only need their mobile number
- **OTP via SMS/WhatsApp**: Secure verification using DXing service
- **Auto-registration**: New users are automatically registered as beneficiaries
- **Development mode**: OTP is displayed in UI for testing

### 📱 Mobile-First Design
- **Responsive interface**: Optimized for mobile devices
- **Touch-friendly**: Large buttons and easy navigation
- **Offline-ready**: Progressive Web App capabilities
- **Fast loading**: Optimized for slow networks

### 📋 Dynamic Form System
- **Scheme-specific forms**: Each scheme has its own form configuration
- **Multi-step wizard**: Break complex forms into manageable steps
- **Real-time validation**: Instant feedback on form fields
- **Document upload**: Support for required document submission
- **Auto-save**: Progress is saved automatically

### 📊 Application Tracking
- **Real-time status**: Track application progress
- **Status history**: View all status changes with timestamps
- **Notifications**: SMS/WhatsApp updates on status changes
- **Interview scheduling**: Automated interview booking
- **Payment tracking**: Monitor disbursement status

## API Endpoints

### Authentication
```
POST /api/beneficiary/auth/send-otp
POST /api/beneficiary/auth/verify-otp
POST /api/beneficiary/auth/resend-otp
GET  /api/beneficiary/auth/profile
PUT  /api/beneficiary/auth/profile
```

### Schemes
```
GET /api/beneficiary/schemes
GET /api/beneficiary/schemes/:id
```

### Applications
```
POST /api/beneficiary/applications
GET  /api/beneficiary/applications
GET  /api/beneficiary/applications/:id
PUT  /api/beneficiary/applications/:id/cancel
GET  /api/beneficiary/track/:applicationId
GET  /api/beneficiary/stats
```

## Frontend Routes

### Public Routes
```
/beneficiary-login     - OTP login page
/beneficiary-demo      - System demonstration
/public-schemes        - Public scheme listing
```

### Protected Routes (Beneficiary)
```
/beneficiary/dashboard           - Main dashboard
/beneficiary/schemes             - Available schemes
/beneficiary/apply/:schemeId     - Application form
/beneficiary/track/:id           - Application tracking
```

## Development Setup

### Backend
1. Navigate to `baithuzkath-api` directory
2. Install dependencies: `npm install`
3. Set environment variables in `.env`
4. Start development server: `npm run dev`

### Frontend
1. Install dependencies: `npm install`
2. Set environment variables in `.env`
3. Start development server: `npm run dev`

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
DXING_API_KEY=your_dxing_api_key
DXING_SENDER_ID=BZKRLA
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5001/api
VITE_NODE_ENV=development
```

## Development Features

### OTP Testing
- In development mode, OTP is displayed in the UI
- Auto-fill button for quick testing
- Console logging for debugging
- Fixed OTP (123456) for consistent testing

### Mock Data
- Sample schemes with different categories
- Mock application data for testing
- Simulated status updates
- Test user profiles

## Production Deployment

### DXing Integration
- Configure real DXing API credentials
- Set up WhatsApp Business API
- Enable SMS notifications
- Configure webhook endpoints

### File Upload
- Set up cloud storage (AWS S3, Google Cloud)
- Configure file upload limits
- Enable virus scanning
- Set up CDN for fast delivery

### Security
- Enable HTTPS
- Set up rate limiting
- Configure CORS properly
- Enable request logging

## Testing

### Manual Testing
1. Start both backend and frontend servers
2. Navigate to `/beneficiary-demo` for overview
3. Use `/beneficiary-login` to test OTP flow
4. Apply for schemes and track applications

### API Testing
Run the test script:
```bash
node test-beneficiary-api.js
```

## Database Schema

### User Model (Beneficiary)
```javascript
{
  phone: String (required, unique),
  name: String,
  role: 'beneficiary',
  profile: {
    dateOfBirth: Date,
    gender: String,
    address: Object
  },
  otp: {
    code: String,
    expiresAt: Date,
    verified: Boolean
  }
}
```

### Application Model
```javascript
{
  applicationId: String (unique),
  scheme: ObjectId (ref: Scheme),
  applicant: ObjectId (ref: User),
  formData: Object,
  documents: Array,
  status: String,
  statusHistory: Array,
  submittedAt: Date
}
```

## Future Enhancements

### Phase 2
- [ ] WhatsApp chatbot integration
- [ ] Voice-based form filling
- [ ] Multilingual support (Malayalam, Hindi)
- [ ] Offline form submission
- [ ] Biometric authentication

### Phase 3
- [ ] AI-powered eligibility checking
- [ ] Automated document verification
- [ ] Blockchain-based certificates
- [ ] Integration with government databases
- [ ] Advanced analytics dashboard

## Support

For technical support or questions:
- Email: tech@baithuzzakathkerala.org
- Phone: +91-XXXX-XXXXXX
- Documentation: [Link to full docs]

## License

This project is licensed under the MIT License - see the LICENSE file for details.