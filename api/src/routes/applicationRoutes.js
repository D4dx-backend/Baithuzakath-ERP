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
const { syncApplicationStages } = require('../middleware/syncStages');

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
  syncApplicationStages, // Automatically sync stages from scheme
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

// Update application stage status (for area coordinators)
router.patch('/:id/stages/:stageId', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'area_admin'), 
  async (req, res) => {
    try {
      const { id, stageId } = req.params;
      const { status, notes } = req.body;

      const Application = require('../models/Application');
      
      // Find the application
      const application = await Application.findById(id);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Find the stage to update
      const stageIndex = application.applicationStages.findIndex(
        stage => stage._id.toString() === stageId
      );

      if (stageIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Stage not found'
        });
      }

      // Update the stage
      application.applicationStages[stageIndex].status = status;
      application.applicationStages[stageIndex].notes = notes;
      
      if (status === 'completed') {
        application.applicationStages[stageIndex].completedAt = new Date();
        application.applicationStages[stageIndex].completedBy = req.user._id;
      }

      // Add to stage history
      if (!application.stageHistory) {
        application.stageHistory = [];
      }
      
      application.stageHistory.push({
        stageName: application.applicationStages[stageIndex].name,
        status: status,
        timestamp: new Date(),
        updatedBy: req.user._id,
        notes: notes
      });

      // Update current stage if needed
      const completedStages = application.applicationStages.filter(s => s.status === 'completed').length;
      const nextPendingStage = application.applicationStages.find(s => s.status === 'pending');
      if (nextPendingStage) {
        application.currentStage = nextPendingStage.name;
      }

      await application.save();

      // Populate user data for response
      await application.populate('applicationStages.completedBy', 'name role');
      await application.populate('stageHistory.updatedBy', 'name role');

      res.json({
        success: true,
        message: 'Stage updated successfully',
        data: {
          application
        }
      });
    } catch (error) {
      console.error('Error updating stage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update stage'
      });
    }
  }
);

module.exports = router;