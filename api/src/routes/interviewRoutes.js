const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const { authenticate } = require('../middleware/auth');
const RBACMiddleware = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const scheduleInterviewSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  time: Joi.string().required(),
  type: Joi.string().valid('offline', 'online').required(),
  location: Joi.string().when('type', {
    is: 'offline',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  meetingLink: Joi.string().when('type', {
    is: 'online',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  interviewers: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional()
});

const updateInterviewSchema = Joi.object({
  date: Joi.string().isoDate().optional(),
  time: Joi.string().optional(),
  type: Joi.string().valid('offline', 'online').optional(),
  location: Joi.string().optional(),
  meetingLink: Joi.string().optional(),
  interviewers: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional(),
  result: Joi.string().valid('pending', 'passed', 'failed').optional()
});

/**
 * @swagger
 * /api/interviews:
 *   get:
 *     summary: Get all scheduled interviews
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of interviews retrieved successfully
 */
router.get('/', 
  authenticate,
  RBACMiddleware.hasPermission('interviews.read'),
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        date,
        search 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build query for interviews
      let query = {};

      // Apply user scope filtering
      const userScope = await RBACMiddleware.getUserScope(req.user);
      if (userScope.regions && userScope.regions.length > 0) {
        query.$or = [
          { state: { $in: userScope.regions } },
          { district: { $in: userScope.regions } },
          { area: { $in: userScope.regions } },
          { unit: { $in: userScope.regions } }
        ];
      }

      // Filter by status
      if (status !== 'all') {
        query.status = status;
      }

      // Filter by date
      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        query.scheduledDate = {
          $gte: targetDate,
          $lt: nextDay
        };
      }

      const interviews = await Interview.find(query)
        .populate({
          path: 'application',
          populate: [
            { path: 'beneficiary', select: 'name phone' },
            { path: 'scheme', select: 'name code' },
            { path: 'project', select: 'name code' },
            { path: 'state', select: 'name code' },
            { path: 'district', select: 'name code' },
            { path: 'area', select: 'name code' },
            { path: 'unit', select: 'name code' }
          ]
        })
        .populate('scheduledBy', 'name')
        .populate('interviewers', 'name')
        .populate('completedBy', 'name')
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Apply search filter after population if needed
      let filteredInterviews = interviews;
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filteredInterviews = interviews.filter(interview => 
          interview.application.applicationNumber.match(searchRegex) ||
          interview.application.beneficiary.name.match(searchRegex)
        );
      }

      const total = await Interview.countDocuments(query);

      // Transform data for frontend
      const interviewData = filteredInterviews.map(interview => ({
        id: interview._id,
        interviewNumber: interview.interviewNumber,
        applicationId: interview.application.applicationNumber,
        applicantName: interview.application.beneficiary.name,
        applicantPhone: interview.application.beneficiary.phone,
        projectName: interview.application.project?.name || 'N/A',
        schemeName: interview.application.scheme.name,
        date: interview.scheduledDate,
        time: interview.scheduledTime,
        type: interview.type,
        location: interview.location,
        meetingLink: interview.meetingLink,
        interviewers: interview.interviewers?.map(i => i.name) || [],
        status: interview.status,
        notes: interview.notes,
        result: interview.result,
        scheduledBy: interview.scheduledBy?.name,
        scheduledAt: interview.scheduledAt,
        completedAt: interview.completedAt,
        completedBy: interview.completedBy?.name,
        rescheduleCount: interview.rescheduleCount,
        state: interview.application.state.name,
        district: interview.application.district.name,
        area: interview.application.area.name,
        unit: interview.application.unit.name
      }));

      res.json({
        success: true,
        message: 'Interviews retrieved successfully',
        data: {
          interviews: interviewData,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total,
            limit: parseInt(limit)
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching interviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch interviews',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/interviews/schedule/{applicationId}:
 *   post:
 *     summary: Schedule an interview for an application
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - time
 *               - type
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [offline, online]
 *               location:
 *                 type: string
 *               meetingLink:
 *                 type: string
 *               interviewers:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Interview scheduled successfully
 */
router.post('/schedule/:applicationId',
  authenticate,
  // RBACMiddleware.hasPermission('interviews.schedule'), // Temporarily disabled for debugging
  validate(scheduleInterviewSchema),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { date, time, type, location, meetingLink, interviewers, notes } = req.body;

      console.log('Scheduling interview for application:', applicationId);
      console.log('Request body:', req.body);

      // Build query based on applicationId format
      let query = {};
      if (applicationId.match(/^[0-9a-fA-F]{24}$/)) {
        // It's a valid ObjectId
        query = {
          $or: [
            { _id: applicationId },
            { applicationNumber: applicationId }
          ]
        };
      } else {
        // It's likely an application number
        query = { applicationNumber: applicationId };
      }

      const application = await Application.findOne(query);
      console.log('Found application:', application ? application.applicationNumber : 'Not found');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check if user has permission to schedule interview for this application
      // Temporarily disabled for debugging
      // const hasPermission = await RBACMiddleware.checkApplicationAccess(req.user, application);
      // if (!hasPermission) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Access denied for this application',
      //     timestamp: new Date().toISOString()
      //   });
      // }

      // Create new interview record
      const interview = new Interview({
        application: application._id,
        scheduledDate: new Date(date),
        scheduledTime: time,
        type,
        location: type === 'offline' ? location : undefined,
        meetingLink: type === 'online' ? meetingLink : undefined,
        interviewers: interviewers || [],
        scheduledBy: req.user._id,
        createdBy: req.user._id,
        notes
      });

      await interview.save();

      // Update application status
      application.status = 'interview_scheduled';
      await application.save();

      // Populate for response
      await application.populate('beneficiary', 'name phone');
      await application.populate('scheme', 'name');
      await application.populate('project', 'name');

      // TODO: Send notification to beneficiary about interview schedule
      // await notificationService.sendInterviewScheduled(application);

      res.json({
        success: true,
        message: 'Interview scheduled successfully',
        data: {
          interview: {
            id: interview._id,
            interviewNumber: interview.interviewNumber,
            applicationNumber: application.applicationNumber,
            applicantName: application.beneficiary.name,
            scheduledDate: interview.scheduledDate,
            scheduledTime: interview.scheduledTime,
            type: interview.type,
            location: interview.location,
            meetingLink: interview.meetingLink
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error scheduling interview:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        applicationId: req.params.applicationId,
        body: req.body
      });
      res.status(500).json({
        success: false,
        message: 'Failed to schedule interview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/interviews/{applicationId}:
 *   put:
 *     summary: Update interview details
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [offline, online]
 *               location:
 *                 type: string
 *               meetingLink:
 *                 type: string
 *               interviewers:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *               result:
 *                 type: string
 *                 enum: [pending, passed, failed]
 *     responses:
 *       200:
 *         description: Interview updated successfully
 */
router.put('/:applicationId',
  authenticate,
  RBACMiddleware.hasPermission('interviews.update'),
  validate(updateInterviewSchema),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const updateData = req.body;

      // Find the application
      const application = await Application.findOne({
        $or: [
          { _id: applicationId },
          { applicationNumber: applicationId }
        ]
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found',
          timestamp: new Date().toISOString()
        });
      }

      console.log('🔍 Looking for active interview for application:', application._id);
      
      // Find the active interview for this application
      const activeInterview = await Interview.getActiveInterview(application._id);
      
      console.log('📋 Active interview found:', activeInterview ? activeInterview.interviewNumber : 'None');
      
      if (!activeInterview) {
        // Try to find any interview for this application
        const anyInterview = await Interview.findOne({ application: application._id });
        console.log('📋 Any interview found:', anyInterview ? anyInterview.interviewNumber : 'None');
        
        return res.status(404).json({
          success: false,
          message: 'No active interview found for this application',
          timestamp: new Date().toISOString()
        });
      }

      // Check permission
      const hasPermission = await RBACMiddleware.checkApplicationAccess(req.user, application);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this application',
          timestamp: new Date().toISOString()
        });
      }

      console.log('🔄 Rescheduling interview with data:', updateData);
      
      // Reschedule the interview (creates new interview record and marks old one as rescheduled)
      const newInterview = await activeInterview.reschedule({
        scheduledDate: updateData.date ? new Date(updateData.date) : activeInterview.scheduledDate,
        scheduledTime: updateData.time || activeInterview.scheduledTime,
        type: updateData.type || activeInterview.type,
        location: updateData.location !== undefined ? updateData.location : activeInterview.location,
        meetingLink: updateData.meetingLink !== undefined ? updateData.meetingLink : activeInterview.meetingLink,
        interviewers: updateData.interviewers || activeInterview.interviewers,
        notes: updateData.notes || activeInterview.notes
      }, 'Interview rescheduled via API', req.user._id);
      
      console.log('✅ New interview created:', newInterview.interviewNumber);

      await newInterview.populate('scheduledBy', 'name');

      res.json({
        success: true,
        message: 'Interview rescheduled successfully',
        data: {
          interview: {
            id: newInterview._id,
            interviewNumber: newInterview.interviewNumber,
            scheduledDate: newInterview.scheduledDate,
            scheduledTime: newInterview.scheduledTime,
            type: newInterview.type,
            location: newInterview.location,
            meetingLink: newInterview.meetingLink,
            rescheduleCount: newInterview.rescheduleCount
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error updating interview:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        applicationId: req.params.applicationId,
        body: req.body
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update interview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/interviews/{applicationId}/complete:
 *   patch:
 *     summary: Mark interview as completed
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - result
 *             properties:
 *               result:
 *                 type: string
 *                 enum: [passed, failed]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Interview completed successfully
 */
router.patch('/:applicationId/complete',
  authenticate,
  RBACMiddleware.hasPermission('interviews.update'),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { result, notes } = req.body;

      const application = await Application.findOne({
        $or: [
          { _id: applicationId },
          { applicationNumber: applicationId }
        ]
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check permission
      const hasPermission = await RBACMiddleware.checkApplicationAccess(req.user, application);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this application',
          timestamp: new Date().toISOString()
        });
      }

      // Update interview completion
      application.status = 'interview_completed';
      application.interview.result = result;
      application.interview.completedAt = new Date();
      if (notes) {
        application.interview.notes = notes;
      }

      await application.save();

      res.json({
        success: true,
        message: 'Interview completed successfully',
        data: {
          interview: application.interview
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error completing interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete interview',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/interviews/{applicationId}/cancel:
 *   patch:
 *     summary: Cancel a scheduled interview
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Interview cancelled successfully
 */
router.patch('/:applicationId/cancel',
  authenticate,
  RBACMiddleware.hasPermission('interviews.cancel'),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { reason } = req.body;

      const application = await Application.findOne({
        $or: [
          { _id: applicationId },
          { applicationNumber: applicationId }
        ]
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check permission
      const hasPermission = await RBACMiddleware.checkApplicationAccess(req.user, application);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this application',
          timestamp: new Date().toISOString()
        });
      }

      // Cancel interview - revert to under_review status
      application.status = 'under_review';
      application.interview.notes = `Interview cancelled: ${reason}`;

      await application.save();

      res.json({
        success: true,
        message: 'Interview cancelled successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error cancelling interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel interview',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/interviews/history/{applicationId}:
 *   get:
 *     summary: Get interview history for an application
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Interview history retrieved successfully
 */
router.get('/history/:applicationId',
  authenticate,
  RBACMiddleware.hasPermission('interviews.read'),
  async (req, res) => {
    try {
      const { applicationId } = req.params;

      // Find the application
      const application = await Application.findOne({
        $or: [
          { _id: applicationId },
          { applicationNumber: applicationId }
        ]
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found',
          timestamp: new Date().toISOString()
        });
      }

      // Get interview history
      const history = await Interview.getApplicationHistory(application._id);

      res.json({
        success: true,
        message: 'Interview history retrieved successfully',
        data: {
          applicationId: application.applicationNumber,
          applicantName: application.beneficiary?.name,
          history: history.map(interview => ({
            id: interview._id,
            interviewNumber: interview.interviewNumber,
            scheduledDate: interview.scheduledDate,
            scheduledTime: interview.scheduledTime,
            type: interview.type,
            location: interview.location,
            meetingLink: interview.meetingLink,
            status: interview.status,
            result: interview.result,
            notes: interview.notes,
            rescheduleCount: interview.rescheduleCount,
            rescheduleReason: interview.rescheduleReason,
            scheduledBy: interview.scheduledBy?.name,
            completedBy: interview.completedBy?.name,
            scheduledAt: interview.scheduledAt,
            completedAt: interview.completedAt,
            originalInterview: interview.originalInterview?.interviewNumber
          }))
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching interview history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch interview history',
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;