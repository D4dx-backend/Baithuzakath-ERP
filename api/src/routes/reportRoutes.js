const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Import models
const Report = require('../models/Report');
const Application = require('../models/Application');

// Import middleware
const { authenticate } = require('../middleware/auth');
const RBACMiddleware = require('../middleware/rbacMiddleware');

/**
 * @swagger
 * /api/reports/application/{applicationId}:
 *   get:
 *     summary: Get reports for an application
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID or Application Number
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
      
      console.log('🔍 GET Reports - applicationId:', applicationId);
      console.log('🔍 GET Reports - user:', req.user.email);

      // Step 1: Find the application by application number or ObjectId
      let application;
      
      // Try to find by applicationNumber first
      application = await Application.findOne({ 
        applicationNumber: applicationId 
      });
      
      // If not found and applicationId looks like an ObjectId, try finding by _id
      if (!application && mongoose.Types.ObjectId.isValid(applicationId)) {
        application = await Application.findById(applicationId);
      }

      console.log('🔍 GET Reports - applicationId received:', applicationId);
      console.log('🔍 GET Reports - applicationId type:', typeof applicationId);
      console.log('🔍 GET Reports - applicationId length:', applicationId?.length);
      console.log('🔍 GET Reports - application found:', application ? application.applicationNumber : 'NOT FOUND');
      
      if (!application) {
        // Additional debugging - let's see what applications exist
        const allApps = await Application.find({}).limit(3).select('applicationNumber');
        console.log('🔍 GET Reports - Available applications:', allApps.map(a => a.applicationNumber));
      }

      if (!application) {
        console.log('❌ GET Reports - Application not found');
        return res.status(404).json({
          success: false,
          message: 'Application not found',
          timestamp: new Date().toISOString()
        });
      }

      // Step 2: Check permissions (simplified for now)
      console.log('✅ GET Reports - Application found, checking permissions...');

      // Step 3: Get reports for this application using the ObjectId
      const reports = await Report.find({ 
        application: application._id 
      })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

      console.log('🔍 GET Reports - Found reports count:', reports.length);

      // Step 4: Format response
      const formattedReports = reports.map(report => ({
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
        isPublic: report.isPublic,
        createdBy: report.createdBy?.name || 'Unknown',
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }));

      console.log('✅ GET Reports - Success, returning', formattedReports.length, 'reports');

      res.json({
        success: true,
        message: 'Reports retrieved successfully',
        data: {
          applicationId: application.applicationNumber,
          applicationObjectId: application._id,
          reports: formattedReports
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ GET Reports - Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID or Application Number
 *     responses:
 *       201:
 *         description: Report created successfully
 */
router.post('/application/:applicationId',
  authenticate,
  RBACMiddleware.hasPermission('reports.create'),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const reportData = req.body;

      console.log('📝 POST Reports - applicationId:', applicationId);
      console.log('📝 POST Reports - user:', req.user.email);
      console.log('📝 POST Reports - data:', JSON.stringify(reportData, null, 2));

      // Step 1: Find the application by application number or ObjectId
      let application;
      
      // Try to find by applicationNumber first
      application = await Application.findOne({ 
        applicationNumber: applicationId 
      });
      
      // If not found and applicationId looks like an ObjectId, try finding by _id
      if (!application && mongoose.Types.ObjectId.isValid(applicationId)) {
        application = await Application.findById(applicationId);
      }

      console.log('📝 POST Reports - applicationId received:', applicationId);
      console.log('📝 POST Reports - application found:', application ? application.applicationNumber : 'NOT FOUND');

      if (!application) {
        console.log('❌ POST Reports - Application not found');
        return res.status(404).json({
          success: false,
          message: 'Application not found',
          timestamp: new Date().toISOString()
        });
      }

      // Step 2: Create the report with the application's ObjectId
      // Always set report date to today (not editable)
      const reportDate = new Date();
      
      const report = new Report({
        application: application._id, // Use the ObjectId here
        reportDate: reportDate, // Always today's date
        reportType: reportData.reportType || 'interview',
        title: reportData.title,
        details: reportData.details,
        status: reportData.status || 'submitted',
        priority: reportData.priority || 'medium',
        followUpRequired: reportData.followUpRequired || false,
        followUpDate: reportData.followUpDate ? new Date(reportData.followUpDate) : undefined,
        followUpNotes: reportData.followUpNotes || '',
        isPublic: reportData.isPublic || false,
        createdBy: req.user._id
      });

      console.log('📝 POST Reports - Creating report with application ObjectId:', application._id);

      await report.save();
      await report.populate('createdBy', 'name email');

      console.log('✅ POST Reports - Report created successfully:', report.reportNumber);

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
            followUpRequired: report.followUpRequired,
            followUpDate: report.followUpDate,
            followUpNotes: report.followUpNotes,
            isPublic: report.isPublic,
            createdBy: report.createdBy?.name,
            createdAt: report.createdAt
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ POST Reports - Error:', error);
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
 *     summary: Update a report (only by creator or admin)
 *     tags: [Reports]
 */
router.put('/:reportId',
  authenticate,
  RBACMiddleware.hasPermission('reports.update'),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const updateData = req.body;

      console.log('✏️ PUT Reports - reportId:', reportId);
      console.log('✏️ PUT Reports - user:', req.user.email);

      const report = await Report.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check if user is the creator of the report or has admin privileges
      const isCreator = report.createdBy.toString() === req.user._id.toString();
      const isAdmin = ['super_admin', 'state_admin', 'district_admin'].includes(req.user.role);

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit reports created by you',
          timestamp: new Date().toISOString()
        });
      }

      // Update fields (but don't allow changing reportDate - it stays as original creation date)
      Object.keys(updateData).forEach(key => {
        if (key === 'followUpDate') {
          report[key] = updateData[key] ? new Date(updateData[key]) : undefined;
        } else if (key !== 'createdBy' && key !== 'reportDate') { // Prevent changing creator and report date
          report[key] = updateData[key];
        }
      });

      // Set updatedBy to current user
      report.updatedBy = req.user._id;

      await report.save();
      await report.populate('createdBy', 'name email');

      console.log('✅ PUT Reports - Report updated successfully');

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
            followUpRequired: report.followUpRequired,
            followUpDate: report.followUpDate,
            followUpNotes: report.followUpNotes,
            isPublic: report.isPublic,
            createdBy: report.createdBy?.name,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ PUT Reports - Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @swagger
 * /api/reports/{reportId}:
 *   delete:
 *     summary: Delete a report (with captcha confirmation)
 *     tags: [Reports]
 */
router.delete('/:reportId',
  authenticate,
  RBACMiddleware.hasPermission('reports.delete'),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { captcha } = req.body;

      console.log('🗑️ DELETE Reports - reportId:', reportId);
      console.log('🗑️ DELETE Reports - user:', req.user.email);

      // Validate captcha confirmation
      if (!captcha || captcha.toLowerCase() !== 'delete') {
        return res.status(400).json({
          success: false,
          message: 'Please type "DELETE" to confirm deletion',
          timestamp: new Date().toISOString()
        });
      }

      const report = await Report.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check if user is the creator of the report or has admin privileges
      const isCreator = report.createdBy.toString() === req.user._id.toString();
      const isAdmin = ['super_admin', 'state_admin', 'district_admin'].includes(req.user.role);

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete reports created by you',
          timestamp: new Date().toISOString()
        });
      }

      await Report.findByIdAndDelete(reportId);

      console.log('✅ DELETE Reports - Report deleted successfully');

      res.json({
        success: true,
        message: 'Report deleted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ DELETE Reports - Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;