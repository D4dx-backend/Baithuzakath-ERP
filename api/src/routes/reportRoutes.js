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

      // Step 1: Find the application by application number (not ObjectId)
      const application = await Application.findOne({ 
        applicationNumber: applicationId 
      });

      console.log('🔍 GET Reports - application found:', application ? application.applicationNumber : 'NOT FOUND');

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

      // Step 1: Find the application by application number
      const application = await Application.findOne({ 
        applicationNumber: applicationId 
      });

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
      const report = new Report({
        application: application._id, // Use the ObjectId here
        reportDate: new Date(reportData.reportDate),
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
 *     summary: Update a report
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

      const report = await Report.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
          timestamp: new Date().toISOString()
        });
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (key === 'reportDate' || key === 'followUpDate') {
          report[key] = updateData[key] ? new Date(updateData[key]) : undefined;
        } else {
          report[key] = updateData[key];
        }
      });

      await report.save();
      await report.populate('createdBy', 'name email');

      console.log('✅ PUT Reports - Report updated successfully');

      res.json({
        success: true,
        message: 'Report updated successfully',
        data: { report },
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
 *     summary: Delete a report
 *     tags: [Reports]
 */
router.delete('/:reportId',
  authenticate,
  RBACMiddleware.hasPermission('reports.delete'),
  async (req, res) => {
    try {
      const { reportId } = req.params;

      console.log('🗑️ DELETE Reports - reportId:', reportId);

      const report = await Report.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
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