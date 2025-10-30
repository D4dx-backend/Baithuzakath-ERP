const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Application = require('../models/Application');
const { authenticate } = require('../middleware/auth');
const RBACMiddleware = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const createReportSchema = Joi.object({
  reportDate: Joi.string().isoDate().required(),
  reportType: Joi.string().valid('interview', 'enquiry', 'field_verification', 'document_review', 'follow_up', 'other').required(),
  title: Joi.string().required(),
  details: Joi.string().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  followUpRequired: Joi.boolean().optional(),
  followUpDate: Joi.string().isoDate().optional(),
  followUpNotes: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublic: Joi.boolean().optional()
});

const updateReportSchema = Joi.object({
  reportDate: Joi.string().isoDate().optional(),
  reportType: Joi.string().valid('interview', 'enquiry', 'field_verification', 'document_review', 'follow_up', 'other').optional(),
  title: Joi.string().optional(),
  details: Joi.string().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  followUpRequired: Joi.boolean().optional(),
  followUpDate: Joi.string().isoDate().optional(),
  followUpNotes: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublic: Joi.boolean().optional()
});

/**
 * @swagger
 * /api/reports/application/{applicationId}:
 *   get:
 *     summary: Get all reports for an application
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [interview, enquiry, field_verification, document_review, follow_up, other]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, reviewed, approved]
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 */
router.get('/application/:applicationId',
  authenticate,
  RBACMiddleware.hasPermission('reports.read'),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { reportType, status } = req.query;

      console.log('Fetching reports for applicationId:', applicationId);

      // Find the application - handle both ObjectId and application number
      let query = {};
      if (mongoose.Types.ObjectId.isValid(applicationId) && applicationId.length === 24) {
        // It's a valid ObjectId
        query = {
          $or: [
            { _id: applicationId },
            { applicationNumber: applicationId }
          ]
        };
        console.log('Using ObjectId query for GET');
      } else {
        // It's likely an application number
        query = { applicationNumber: applicationId };
        console.log('Using application number query for GET');
      }

      const application = await Application.findOne(query);

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

      // Get reports for the application
      const reports = await Report.getApplicationReports(application._id, {
        reportType,
        status
      });

      res.json({
        success: true,
        message: 'Reports retrieved successfully',
        data: {
          applicationId: application.applicationNumber,
          reports: reports.map(report => ({
            id: report._id,
            reportNumber: report.reportNumber,
            reportDate: report.reportDate,
            reportType: report.reportType,
            title: report.title,
            details: report.details,
            status: report.status,
            priority: report.priority,
            followUpRequired: report.followUpRequired,
            followUpDate: report.followUpDate,
            followUpNotes: report.followUpNotes,
            tags: report.tags,
            isPublic: report.isPublic,
            createdBy: report.createdBy?.name,
            reviewedBy: report.reviewedBy?.name,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            reviewedAt: report.reviewedAt,
            reviewComments: report.reviewComments
          }))
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/reports/application/{applicationId}:
 *   post:
 *     summary: Create a new report for an application
 *     tags: [Reports]
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
 *               - reportDate
 *               - reportType
 *               - title
 *               - details
 *             properties:
 *               reportDate:
 *                 type: string
 *                 format: date
 *               reportType:
 *                 type: string
 *                 enum: [interview, enquiry, field_verification, document_review, follow_up, other]
 *               title:
 *                 type: string
 *               details:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               followUpRequired:
 *                 type: boolean
 *               followUpDate:
 *                 type: string
 *                 format: date
 *               followUpNotes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Report created successfully
 */
router.post('/application/:applicationId',
  authenticate,
  RBACMiddleware.hasPermission('reports.create'),
  validate(createReportSchema),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const reportData = req.body;

      console.log('Creating report for applicationId:', applicationId);

      // Find the application - handle both ObjectId and application number
      let query = {};
      if (mongoose.Types.ObjectId.isValid(applicationId) && applicationId.length === 24) {
        // It's a valid ObjectId
        query = {
          $or: [
            { _id: applicationId },
            { applicationNumber: applicationId }
          ]
        };
        console.log('Using ObjectId query');
      } else {
        // It's likely an application number
        query = { applicationNumber: applicationId };
        console.log('Using application number query');
      }

      const application = await Application.findOne(query);

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

      // Create new report
      const report = new Report({
        ...reportData,
        application: application._id,
        reportDate: new Date(reportData.reportDate),
        followUpDate: reportData.followUpDate ? new Date(reportData.followUpDate) : undefined,
        createdBy: req.user._id
      });

      await report.save();
      await report.populate('createdBy', 'name');

      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: {
          report: {
            id: report._id,
            reportNumber: report.reportNumber,
            reportDate: report.reportDate,
            reportType: report.reportType,
            title: report.title,
            details: report.details,
            status: report.status,
            priority: report.priority,
            createdBy: report.createdBy?.name,
            createdAt: report.createdAt
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/reports/{reportId}:
 *   put:
 *     summary: Update a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
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
 *               reportDate:
 *                 type: string
 *                 format: date
 *               reportType:
 *                 type: string
 *                 enum: [interview, enquiry, field_verification, document_review, follow_up, other]
 *               title:
 *                 type: string
 *               details:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               followUpRequired:
 *                 type: boolean
 *               followUpDate:
 *                 type: string
 *                 format: date
 *               followUpNotes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Report updated successfully
 */
router.put('/:reportId',
  authenticate,
  RBACMiddleware.hasPermission('reports.update'),
  validate(updateReportSchema),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const updateData = req.body;

      const report = await Report.findById(reportId).populate('application');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check permission
      const hasPermission = await RBACMiddleware.checkApplicationAccess(req.user, report.application);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this report',
          timestamp: new Date().toISOString()
        });
      }

      // Update report
      Object.keys(updateData).forEach(key => {
        if (key === 'reportDate' || key === 'followUpDate') {
          report[key] = updateData[key] ? new Date(updateData[key]) : undefined;
        } else {
          report[key] = updateData[key];
        }
      });

      report.updatedBy = req.user._id;
      await report.save();

      res.json({
        success: true,
        message: 'Report updated successfully',
        data: {
          report: {
            id: report._id,
            reportNumber: report.reportNumber,
            reportDate: report.reportDate,
            reportType: report.reportType,
            title: report.title,
            details: report.details,
            status: report.status,
            priority: report.priority,
            updatedAt: report.updatedAt
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update report',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/reports/{reportId}:
 *   delete:
 *     summary: Delete a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted successfully
 */
router.delete('/:reportId',
  authenticate,
  RBACMiddleware.hasPermission('reports.delete'),
  async (req, res) => {
    try {
      const { reportId } = req.params;

      const report = await Report.findById(reportId).populate('application');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check permission
      const hasPermission = await RBACMiddleware.checkApplicationAccess(req.user, report.application);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for this report',
          timestamp: new Date().toISOString()
        });
      }

      await Report.findByIdAndDelete(reportId);

      res.json({
        success: true,
        message: 'Report deleted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete report',
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;