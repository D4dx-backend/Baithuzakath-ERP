const express = require('express');
const router = express.Router();
const beneficiaryAuthController = require('../controllers/beneficiaryAuthController');
const beneficiaryApplicationController = require('../controllers/beneficiaryApplicationController');
const beneficiaryController = require('../controllers/beneficiaryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// ============================================================================
// BENEFICIARY-FACING ROUTES (Public & Protected)
// These MUST come FIRST to avoid being caught by admin routes
// ============================================================================

// Authentication routes (no auth required)
router.post('/auth/send-otp', [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number'),
  validateRequest
], beneficiaryAuthController.sendOTP);

router.post('/auth/verify-otp', [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  validateRequest
], beneficiaryAuthController.verifyOTP);

router.post('/auth/resend-otp', [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number'),
  validateRequest
], beneficiaryAuthController.resendOTP);

// Get locations for signup (no auth required)
router.get('/auth/locations', [
  query('type').optional().isIn(['district', 'area', 'unit']),
  query('parent').optional().isMongoId(),
  validateRequest
], beneficiaryAuthController.getLocations);

// Protected beneficiary routes (require authentication and beneficiary role)
router.get('/auth/profile', 
  authenticate, 
  authorize('beneficiary'), 
  beneficiaryAuthController.getProfile
);
router.put('/auth/profile', 
  authenticate, 
  authorize('beneficiary'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('profile.dateOfBirth').optional().isISO8601(),
    body('profile.gender').optional().isIn(['male', 'female', 'other']),
    validateRequest
  ], 
  beneficiaryAuthController.updateProfile
);

// Scheme routes
router.get('/schemes', 
  authenticate, 
  authorize('beneficiary'),
  [
    query('category').optional().trim(),
    query('search').optional().trim(),
    query('status').optional().isIn(['active', 'inactive', 'upcoming']),
    validateRequest
  ], 
  beneficiaryApplicationController.getAvailableSchemes
);

router.get('/schemes/:id', 
  authenticate, 
  authorize('beneficiary'),
  [
    param('id').isMongoId().withMessage('Invalid scheme ID'),
    validateRequest
  ], 
  beneficiaryApplicationController.getSchemeDetails
);

// Application routes
router.post('/applications', 
  authenticate, 
  authorize('beneficiary'),
  [
    body('schemeId')
      .notEmpty()
      .withMessage('Scheme ID is required')
      .isMongoId()
      .withMessage('Invalid scheme ID'),
    body('formData')
      .notEmpty()
      .withMessage('Form data is required')
      .isObject()
      .withMessage('Form data must be an object'),
    body('documents').optional().isArray(),
    validateRequest
  ], 
  beneficiaryApplicationController.submitApplication
);

router.get('/applications', 
  authenticate, 
  authorize('beneficiary'),
  [
    query('status').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validateRequest
  ], 
  beneficiaryApplicationController.getMyApplications
);

router.get('/applications/:id', 
  authenticate, 
  authorize('beneficiary'),
  [
    param('id').isMongoId().withMessage('Invalid application ID'),
    validateRequest
  ], 
  beneficiaryApplicationController.getApplicationDetails
);

router.put('/applications/:id/cancel', 
  authenticate, 
  authorize('beneficiary'),
  [
    param('id').isMongoId().withMessage('Invalid application ID'),
    body('reason').optional().trim().isLength({ max: 500 }),
    validateRequest
  ], 
  beneficiaryApplicationController.cancelApplication
);

// Tracking routes
router.get('/track/:applicationId', 
  authenticate, 
  authorize('beneficiary'),
  [
    param('applicationId').notEmpty().withMessage('Application ID is required'),
    validateRequest
  ], 
  beneficiaryApplicationController.trackApplication
);

// Statistics
router.get('/stats', 
  authenticate, 
  authorize('beneficiary'),
  beneficiaryApplicationController.getApplicationStats
);

// ============================================================================
// ADMIN ROUTES FOR BENEFICIARY MANAGEMENT
// These are accessed via /api/beneficiaries (different from /api/beneficiary)
// ============================================================================

// Create beneficiary (admin route)
router.post('/', 
  authenticate,
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'),
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Phone must be a valid 10-digit Indian mobile number'),
    body('state')
      .notEmpty()
      .withMessage('State is required')
      .isMongoId()
      .withMessage('Invalid state ID'),
    body('district')
      .notEmpty()
      .withMessage('District is required')
      .isMongoId()
      .withMessage('Invalid district ID'),
    body('area')
      .notEmpty()
      .withMessage('Area is required')
      .isMongoId()
      .withMessage('Invalid area ID'),
    body('unit')
      .notEmpty()
      .withMessage('Unit is required')
      .isMongoId()
      .withMessage('Invalid unit ID'),
    body('status').optional().isIn(['active', 'inactive', 'pending']),
    validateRequest
  ],
  beneficiaryController.createBeneficiary
);

// Get all beneficiaries (admin route)
router.get('/', 
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('status').optional().trim(),
    query('includeApprovedInterviews').optional().isBoolean(),
    validateRequest
  ],
  beneficiaryController.getBeneficiaries
);

// Get beneficiary by ID (admin route)
router.get('/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid beneficiary ID'),
    validateRequest
  ],
  beneficiaryController.getBeneficiary
);

// Update beneficiary (admin route)
router.put('/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid beneficiary ID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Phone must be a valid 10-digit Indian mobile number'),
    body('state').optional().isMongoId().withMessage('Invalid state ID'),
    body('district').optional().isMongoId().withMessage('Invalid district ID'),
    body('area').optional().isMongoId().withMessage('Invalid area ID'),
    body('unit').optional().isMongoId().withMessage('Invalid unit ID'),
    body('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('Status must be one of: active, inactive, pending'),
    validateRequest
  ],
  beneficiaryController.updateBeneficiary
);

// Verify beneficiary (admin route)
router.patch('/:id/verify',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid beneficiary ID'),
    validateRequest
  ],
  beneficiaryController.verifyBeneficiary
);

// Delete beneficiary (admin route)
router.delete('/:id',
  authenticate,
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'),
  [
    param('id').isMongoId().withMessage('Invalid beneficiary ID'),
    validateRequest
  ],
  beneficiaryController.deleteBeneficiary
);

module.exports = router;