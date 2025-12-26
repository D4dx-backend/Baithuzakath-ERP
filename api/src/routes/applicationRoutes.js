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

// Get applications pending committee approval
router.get('/committee/pending', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'district_admin'), 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const Application = require('../models/Application');
      const Beneficiary = require('../models/Beneficiary');

      // Build filter
      const filter = { status: 'pending_committee_approval' };

      if (search) {
        const beneficiaries = await Beneficiary.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        filter.$or = [
          { applicationNumber: { $regex: search, $options: 'i' } },
          { beneficiary: { $in: beneficiaries.map(b => b._id) } }
        ];
      }

      // Apply user scope filtering (bypass for super_admin and state_admin)
      const RBACMiddleware = require('../middleware/rbacMiddleware');
      if (req.user.role !== 'super_admin' && req.user.role !== 'state_admin') {
        const userScope = await RBACMiddleware.getUserScope(req.user);
        if (userScope.state) filter['location.state'] = userScope.state;
        if (userScope.district) filter['location.district'] = userScope.district;
      }

      const total = await Application.countDocuments(filter);
      const applications = await Application.find(filter)
        .populate('beneficiary', 'name phone email location')
        .populate('scheme', 'name category')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: {
          applications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching pending committee applications:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch applications'
      });
    }
  }
);

// Committee decision on application
router.patch('/:id/committee-decision', 
  authenticate, 
  authorize('super_admin', 'state_admin', 'district_admin'), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { decision, comments, distributionTimeline } = req.body;

      if (!decision || !['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: 'Valid decision (approved or rejected) is required'
        });
      }

      const Application = require('../models/Application');
      const application = await Application.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      if (application.status !== 'pending_committee_approval') {
        return res.status(400).json({
          success: false,
          message: 'Application is not pending committee approval'
        });
      }

      // Update application with committee decision
      application.status = decision;
      application.committeeApprovedBy = req.user._id;
      application.committeeApprovedAt = new Date();
      application.committeeComments = comments;

      if (decision === 'approved' && distributionTimeline && Array.isArray(distributionTimeline)) {
        application.distributionTimeline = distributionTimeline;
        application.approvedAmount = distributionTimeline.reduce((sum, phase) => sum + (phase.amount || 0), 0);
      }

      await application.save();

      // Create payment records for approved applications
      if (decision === 'approved' && distributionTimeline && Array.isArray(distributionTimeline)) {
        try {
          const Payment = require('../models/Payment');
          
          console.log('💰 Creating payment records for approved application');
          
          for (let index = 0; index < distributionTimeline.length; index++) {
            const phase = distributionTimeline[index];
            const paymentData = {
              application: application._id,
              beneficiary: application.beneficiary,
              scheme: application.scheme,
              project: application.project,
              amount: phase.amount,
              type: 'installment',
              method: 'bank_transfer',
              installment: {
                number: index + 1,
                totalInstallments: distributionTimeline.length,
                description: phase.description
              },
              timeline: {
                initiatedAt: new Date(),
                expectedCompletionDate: phase.expectedDate
              },
              status: 'pending',
              initiatedBy: req.user._id,
              location: {
                state: application.location?.state,
                district: application.location?.district,
                area: application.location?.area,
                unit: application.location?.unit
              }
            };
            
            const payment = await Payment.create(paymentData);
            console.log(`✅ Payment ${index + 1}/${distributionTimeline.length} created:`, payment.paymentNumber);
          }
          
          console.log(`✅ Created ${distributionTimeline.length} payment records`);
        } catch (paymentError) {
          console.error('❌ Error creating payments:', paymentError);
          // Don't fail the whole request if payment creation fails
        }
      }

      // Create a report entry for the committee decision
      try {
        const Report = require('../models/Report');
        const reportTitle = decision === 'approved' 
          ? 'Committee Approved Application' 
          : 'Committee Rejected Application';
        
        await Report.create({
          type: 'application_decision',
          title: reportTitle,
          description: comments || `Application ${application.applicationNumber} was ${decision} by committee`,
          generatedBy: req.user._id,
          relatedApplication: application._id,
          data: {
            applicationNumber: application.applicationNumber,
            decision: decision,
            committeeComments: comments,
            distributionTimeline: distributionTimeline
          }
        });
      } catch (reportError) {
        console.error('❌ Error creating report:', reportError);
      }

      res.json({
        success: true,
        message: `Application ${decision} successfully`,
        data: { application }
      });
    } catch (error) {
      console.error('Error processing committee decision:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process committee decision'
      });
    }
  }
);

module.exports = router;