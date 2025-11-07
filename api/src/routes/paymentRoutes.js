const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { authenticate, authorize } = require('../middleware/auth');
const RBACMiddleware = require('../middleware/rbacMiddleware');
const pdfReceiptController = require('../controllers/pdfReceiptController');

// Apply authentication to all routes
router.use(authenticate);

// Add a test route without RBAC for debugging
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test payment route accessed by user:', req.user?._id);
    
    const Payment = require('../models/Payment');
    const count = await Payment.countDocuments();
    
    res.json({
      success: true,
      message: 'Test route working',
      user: req.user ? {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role
      } : null,
      paymentCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Test route failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments with pagination and filters
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of payments per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: Filter by payment status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by beneficiary name or payment number
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', 
  RBACMiddleware.hasPermission('finances.read.regional'),
  async (req, res) => {
    try {
      console.log('🔍 Payment route accessed by user:', req.user?._id, 'with permission:', req.checkedPermission);
      const { 
        page = 1, 
        limit = 10, 
        status = '', 
        search = '',
        type = '',
        method = '',
        project = '',
        scheme = '',
        gender = ''
      } = req.query;

      // Build aggregation pipeline for proper server-side pagination with search
      const pipeline = [];

      // Match stage for basic filters
      const matchStage = {};
      if (status) matchStage.status = status;
      if (type) matchStage.type = type;
      if (method) matchStage.method = method;
      if (project) matchStage.project = new require('mongoose').Types.ObjectId(project);
      if (scheme) matchStage.scheme = new require('mongoose').Types.ObjectId(scheme);

      pipeline.push({ $match: matchStage });

      // Lookup stages for population
      pipeline.push(
        {
          $lookup: {
            from: 'applications',
            localField: 'application',
            foreignField: '_id',
            as: 'application'
          }
        },
        {
          $lookup: {
            from: 'beneficiaries',
            localField: 'beneficiary',
            foreignField: '_id',
            as: 'beneficiary'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'project',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $lookup: {
            from: 'schemes',
            localField: 'scheme',
            foreignField: '_id',
            as: 'scheme'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'initiatedBy',
            foreignField: '_id',
            as: 'initiatedBy'
          }
        }
      );

      // Unwind arrays from lookups
      pipeline.push(
        { $unwind: { path: '$application', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$beneficiary', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$scheme', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$initiatedBy', preserveNullAndEmptyArrays: true } }
      );

      // Add search filter after population
      if (search || gender) {
        const searchMatch = {};
        
        if (search) {
          const searchRegex = new RegExp(search, 'i');
          searchMatch.$or = [
            { paymentNumber: searchRegex },
            { 'beneficiary.name': searchRegex },
            { 'application.applicationNumber': searchRegex },
            { 'beneficiary.personalInfo.name': searchRegex }
          ];
        }

        if (gender) {
          searchMatch['beneficiary.personalInfo.gender'] = gender;
        }

        pipeline.push({ $match: searchMatch });
      }

      // Add sort stage
      pipeline.push({ $sort: { createdAt: -1 } });

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Payment.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Add pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      pipeline.push(
        { $skip: skip },
        { $limit: parseInt(limit) }
      );

      // Execute aggregation
      const payments = await Payment.aggregate(pipeline);

      // Transform data for frontend
      const transformedPayments = payments.map(payment => ({
        id: payment._id,
        paymentNumber: payment.paymentNumber,
        beneficiaryId: payment.application?.applicationNumber || payment.beneficiary?._id,
        beneficiaryName: payment.beneficiary?.name || payment.beneficiary?.personalInfo?.name,
        beneficiaryGender: payment.beneficiary?.personalInfo?.gender || payment.beneficiary?.gender,
        scheme: payment.scheme?.name,
        schemeName: payment.scheme?.name,
        schemeId: payment.scheme?._id,
        project: payment.project?.name,
        projectName: payment.project?.name,
        projectId: payment.project?._id,
        amount: payment.amount,
        type: payment.type,
        method: payment.method,
        status: payment.status,
        scheduledDate: payment.timeline?.expectedCompletionDate,
        completedDate: payment.timeline?.completedAt,
        createdAt: payment.createdAt,
        approvedBy: payment.approvals?.find(a => a.status === 'approved')?.approver?.name,
        phase: payment.installment?.description || 'Full Payment',
        percentage: payment.installment?.number && payment.installment?.totalInstallments ? 
          Math.round((payment.installment.number / payment.installment.totalInstallments) * 100) : 100,
        dueDate: payment.timeline?.expectedCompletionDate,
        approvedAmount: payment.amount,
        source: payment.metadata?.externalReference ? 'interview' : 'direct',
        interviewId: payment.metadata?.externalReference,
        applicationId: payment.application?._id,
        approvalRemarks: payment.metadata?.notes || payment.approvals?.find(a => a.status === 'approved')?.comments,
        approvedAt: payment.timeline?.approvedAt,
        paymentDate: payment.timeline?.completedAt,
        chequeNumber: payment.cheque?.number,
        distributionTimeline: payment.distributionTimeline || []
      }));

      res.json({
        success: true,
        message: 'Payments retrieved successfully',
        data: {
          payments: transformedPayments,
          pagination: {
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total,
            limit: parseInt(limit),
            hasNext: parseInt(page) * parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
          },
          filters: {
            status,
            type,
            method,
            search,
            project,
            scheme,
            gender
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get single payment details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:id', 
  RBACMiddleware.hasPermission('finances.read.regional'),
  async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate('application')
        .populate('beneficiary')
        .populate('project')
        .populate('scheme')
        .populate('initiatedBy', 'name')
        .populate('approvals.approver', 'name');

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Payment details retrieved successfully',
        data: payment,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/payments/{id}/process:
 *   patch:
 *     summary: Process a payment (mark as completed)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: Bank transaction ID
 *               utrNumber:
 *                 type: string
 *                 description: UTR number for bank transfer
 *               notes:
 *                 type: string
 *                 description: Processing notes
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/:id/process', 
  RBACMiddleware.hasPermission('finances.update.regional'),
  async (req, res) => {
    try {
      const { transactionId, utrNumber, notes } = req.body;
      
      const payment = await Payment.findById(req.params.id);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
          timestamp: new Date().toISOString()
        });
      }

      // Update payment status and details
      payment.status = 'completed';
      if (!payment.timeline) payment.timeline = {};
      payment.timeline.completedAt = new Date();
      payment.timeline.processedAt = new Date();
      payment.processedBy = req.user._id;
      
      if (transactionId) {
        if (!payment.bankTransfer) payment.bankTransfer = {};
        payment.bankTransfer.transactionId = transactionId;
      }
      
      if (utrNumber) {
        if (!payment.bankTransfer) payment.bankTransfer = {};
        payment.bankTransfer.utrNumber = utrNumber;
      }
      
      if (notes) {
        payment.processingNotes = notes;
      }

      await payment.save();

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: payment,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/payments/create-from-interview:
 *   post:
 *     summary: Create payment records from approved interview
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interviewId:
 *                 type: string
 *                 description: Interview ID
 *               distributionTimeline:
 *                 type: array
 *                 description: Payment distribution timeline
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     expectedDate:
 *                       type: string
 *                       format: date
 *     responses:
 *       201:
 *         description: Payment records created successfully
 *       404:
 *         description: Interview not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.post('/create-from-interview', 
  RBACMiddleware.hasPermission('finances.create.regional'),
  async (req, res) => {
    try {
      const { interviewId, distributionTimeline } = req.body;
      
      if (!interviewId) {
        return res.status(400).json({
          success: false,
          message: 'Interview ID is required',
          timestamp: new Date().toISOString()
        });
      }

      const Interview = require('../models/Interview');
      const Application = require('../models/Application');
      
      // Find the interview and populate application
      const interview = await Interview.findById(interviewId)
        .populate({
          path: 'application',
          populate: [
            { path: 'beneficiary', select: 'name phone personalInfo financial' },
            { path: 'scheme', select: 'name code' },
            { path: 'project', select: 'name code' }
          ]
        });

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found',
          timestamp: new Date().toISOString()
        });
      }

      if (interview.status !== 'completed' || interview.result !== 'passed') {
        return res.status(400).json({
          success: false,
          message: 'Interview must be completed with passed result',
          timestamp: new Date().toISOString()
        });
      }

      const application = interview.application;
      const createdPayments = [];

      // Create payment records based on distribution timeline
      if (distributionTimeline && distributionTimeline.length > 0) {
        // Update application with distribution timeline
        application.distributionTimeline = distributionTimeline;
        await application.save();

        // Create individual payment records for each timeline entry
        for (let i = 0; i < distributionTimeline.length; i++) {
          const timeline = distributionTimeline[i];
          
          const payment = new Payment({
            application: application._id,
            beneficiary: application.beneficiary._id,
            project: application.project?._id,
            scheme: application.scheme._id,
            amount: timeline.amount,
            type: 'installment',
            method: 'bank_transfer',
            status: 'pending',
            installment: {
              number: i + 1,
              totalInstallments: distributionTimeline.length,
              description: timeline.description
            },
            timeline: {
              expectedCompletionDate: new Date(timeline.expectedDate)
            },
            initiatedBy: req.user._id,
            metadata: {
              notes: `Payment created from interview ${interview.interviewNumber}`,
              tags: ['interview-generated'],
              externalReference: interview._id.toString()
            }
          });

          await payment.save();
          createdPayments.push(payment);
        }
      } else {
        // Create single full payment
        const payment = new Payment({
          application: application._id,
          beneficiary: application.beneficiary._id,
          project: application.project?._id,
          scheme: application.scheme._id,
          amount: application.approvedAmount || application.requestedAmount,
          type: 'full_payment',
          method: 'bank_transfer',
          status: 'pending',
          timeline: {
            expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          },
          initiatedBy: req.user._id,
          metadata: {
            notes: `Full payment created from interview ${interview.interviewNumber}`,
            tags: ['interview-generated'],
            externalReference: interview._id.toString()
          }
        });

        await payment.save();
        createdPayments.push(payment);
      }

      res.status(201).json({
        success: true,
        message: `${createdPayments.length} payment record(s) created successfully`,
        data: {
          payments: createdPayments,
          interview: interview.interviewNumber,
          application: application.applicationNumber
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error creating payments from interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment records',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Update payment schedule details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Payment due date
 *               method:
 *                 type: string
 *                 description: Payment method
 *               phase:
 *                 type: string
 *                 description: Payment phase description
 *               percentage:
 *                 type: number
 *                 description: Payment percentage
 *               status:
 *                 type: string
 *                 description: Payment status
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id', 
  RBACMiddleware.hasAnyPermission(['finances.update.regional', 'finances.manage', 'super_admin', 'state_admin']),
  async (req, res) => {
    try {
      const { amount, dueDate, method, phase, percentage, status } = req.body;
      
      const payment = await Payment.findById(req.params.id);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
          timestamp: new Date().toISOString()
        });
      }

      // Update payment fields
      if (amount !== undefined) payment.amount = amount;
      if (dueDate !== undefined) {
        if (!payment.timeline) payment.timeline = {};
        payment.timeline.expectedCompletionDate = new Date(dueDate);
      }
      if (method !== undefined) payment.method = method;
      if (phase !== undefined) {
        if (!payment.installment) payment.installment = {};
        payment.installment.description = phase;
      }
      if (percentage !== undefined) {
        if (!payment.installment) payment.installment = {};
        // Calculate installment number based on percentage if needed
        if (payment.installment.totalInstallments) {
          payment.installment.number = Math.ceil((percentage / 100) * payment.installment.totalInstallments);
        }
      }
      if (status !== undefined) payment.status = status;
      
      // Update audit fields
      payment.lastModifiedBy = req.user._id;
      payment.updatedAt = new Date();

      await payment.save();

      // Populate the updated payment for response
      const updatedPayment = await Payment.findById(payment._id)
        .populate('application', 'applicationNumber')
        .populate('beneficiary', 'name phone')
        .populate('project', 'name code')
        .populate('scheme', 'name code');

      res.json({
        success: true,
        message: 'Payment updated successfully',
        data: updatedPayment,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/payments/{id}/receipt:
 *   get:
 *     summary: Generate and download PDF receipt for payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: PDF receipt generated and downloaded
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Payment not completed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:id/receipt', 
  RBACMiddleware.hasAnyPermission(['payment_receipts.generate', 'finances.read.regional']),
  pdfReceiptController.generateReceipt.bind(pdfReceiptController)
);

/**
 * @swagger
 * /api/payments/{id}/receipt/download:
 *   get:
 *     summary: Download existing PDF receipt for payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: PDF receipt downloaded
 *       404:
 *         description: Payment or receipt not found
 */
router.get('/:id/receipt/download', 
  RBACMiddleware.hasAnyPermission(['payment_receipts.download', 'finances.read.regional']),
  pdfReceiptController.generateReceipt.bind(pdfReceiptController)
);

/**
 * @swagger
 * /api/payments/{id}/receipt/generate:
 *   post:
 *     summary: Generate PDF receipt file for payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: PDF receipt generated successfully
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Payment not completed
 */
router.post('/:id/receipt/generate', 
  RBACMiddleware.hasAnyPermission(['payment_receipts.generate', 'finances.read.regional']),
  pdfReceiptController.generateReceiptFile.bind(pdfReceiptController)
);

/**
 * @swagger
 * /api/payments/{id}/receipt/status:
 *   get:
 *     summary: Get receipt status for payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Receipt status retrieved
 *       404:
 *         description: Payment not found
 */
router.get('/:id/receipt/status', 
  RBACMiddleware.hasAnyPermission(['payment_receipts.download', 'finances.read.regional']),
  pdfReceiptController.getReceiptStatus.bind(pdfReceiptController)
);

/**
 * @swagger
 * /api/payments/receipts:
 *   get:
 *     summary: List all generated receipts
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of receipts per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by payment number
 *     responses:
 *       200:
 *         description: Receipts list retrieved successfully
 */
router.get('/receipts/list', 
  RBACMiddleware.hasAnyPermission(['payment_receipts.list', 'finances.read.regional']),
  pdfReceiptController.listReceipts.bind(pdfReceiptController)
);

/**
 * @swagger
 * /api/payments/receipts/bulk:
 *   post:
 *     summary: Generate receipts for multiple payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of payment IDs
 *     responses:
 *       200:
 *         description: Bulk receipts generated successfully
 *       400:
 *         description: Invalid payment IDs array
 */
router.post('/receipts/bulk', 
  RBACMiddleware.hasAnyPermission(['payment_receipts.bulk_generate', 'finances.manage']),
  pdfReceiptController.bulkGenerateReceipts.bind(pdfReceiptController)
);

module.exports = router;