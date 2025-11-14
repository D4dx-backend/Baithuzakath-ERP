const express = require('express');
const { body } = require('express-validator');
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  reviewApplication,
  approveApplication,
  deleteApplication
} = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const applicationValidation = [
  body('beneficiary')
    .isMongoId()
    .withMessage('Valid beneficiary ID is required'),
  body('scheme')
    .isMongoId()
    .withMessage('Valid scheme ID is required'),
  body('project')
    .optional()
    .isMongoId()
    .withMessage('Valid project ID is required'),
  body('requestedAmount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Requested amount must be a positive number'),
  body('documents')
    .optional()
    .isArray()
    .withMessage('Documents must be an array')
];

const updateApplicationValidation = [
  body('requestedAmount')
    .optional()
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Requested amount must be a positive number'),
  body('documents')
    .optional()
    .isArray()
    .withMessage('Documents must be an array'),
  body('status')
    .optional()
    .isIn(['pending', 'under_review', 'approved', 'rejected', 'completed'])
    .withMessage('Invalid status')
];

const reviewApplicationValidation = [
  body('status')
    .isIn(['under_review', 'approved', 'rejected'])
    .withMessage('Invalid review status'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters')
];

const approveApplicationValidation = [
  body('approvedAmount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Approved amount must be a positive number'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments must be less than 500 characters')
];

// Routes
router.get('/', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'), 
  getApplications
);

router.get('/:id', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'), 
  getApplication
);

router.post('/', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'), 
  applicationValidation, 
  createApplication
);

router.put('/:id', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'), 
  updateApplicationValidation, 
  updateApplication
);

router.patch('/:id/review', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'area_admin'), 
  reviewApplicationValidation, 
  reviewApplication
);

router.patch('/:id/approve', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'area_admin'), 
  approveApplicationValidation, 
  approveApplication
);

router.delete('/:id', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'), 
  deleteApplication
);

module.exports = router;