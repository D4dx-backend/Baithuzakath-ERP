const Application = require('../models/Application');
const Beneficiary = require('../models/Beneficiary');
const Scheme = require('../models/Scheme');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// Get all applications with pagination and search
const getApplications = async (req, res) => {
  try {
    console.log('🔍 getApplications called by user:', {
      id: req.user._id,
      role: req.user.role,
      adminScope: req.user.adminScope
    });

    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      scheme = '',
      project = '',
      state = '', 
      district = '', 
      area = '', 
      unit = '' 
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      // Search in application number or beneficiary details
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
    
    if (status) filter.status = status;
    if (scheme) filter.scheme = scheme;
    if (project) filter.project = project;
    if (state) filter.state = state;
    if (district) filter.district = district;
    if (area) filter.area = area;
    if (unit) filter.unit = unit;

    // Apply user's regional access restrictions
    const userRegionalFilter = getUserRegionalFilter(req.user);
    console.log('🔍 User regional filter:', userRegionalFilter);
    
    // Temporarily disable regional filtering for debugging
    // Object.assign(filter, userRegionalFilter);
    
    console.log('🔍 Final filter (without regional restrictions):', filter);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Check total applications in database
    const totalApplicationsInDB = await Application.countDocuments();
    console.log('🔍 Total applications in database:', totalApplicationsInDB);
    
    const applications = await Application.find(filter)
      .populate('beneficiary', 'name phone')
      .populate('scheme', 'name code maxAmount')
      .populate('project', 'name code')
      .populate('state', 'name code')
      .populate('district', 'name code')
      .populate('area', 'name code')
      .populate('unit', 'name code')
      .populate('createdBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    res.json({
      success: true,
      data: {
        applications,
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
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      timestamp: new Date().toISOString()
    });
  }
};

// Get single application
const getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('beneficiary')
      .populate('scheme')
      .populate('project')
      .populate('state', 'name code')
      .populate('district', 'name code')
      .populate('area', 'name code')
      .populate('unit', 'name code')
      .populate('createdBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has access to this application
    if (!hasAccessToApplication(req.user, application)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new application
const createApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { beneficiary, scheme, project, requestedAmount, documents } = req.body;

    // Verify beneficiary exists and is active
    const beneficiaryDoc = await Beneficiary.findById(beneficiary);
    if (!beneficiaryDoc) {
      return res.status(400).json({ message: 'Beneficiary not found' });
    }
    if (beneficiaryDoc.status !== 'active') {
      return res.status(400).json({ message: 'Beneficiary must be active to apply' });
    }

    // Verify scheme exists and is active
    const schemeDoc = await Scheme.findById(scheme);
    if (!schemeDoc) {
      return res.status(400).json({ message: 'Scheme not found' });
    }
    if (schemeDoc.status !== 'active') {
      return res.status(400).json({ message: 'Scheme is not active' });
    }

    // Verify project if provided
    let projectDoc = null;
    if (project) {
      projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(400).json({ message: 'Project not found' });
      }
      if (projectDoc.status !== 'active') {
        return res.status(400).json({ message: 'Project is not active' });
      }
    }

    // Validate requested amount
    if (requestedAmount > schemeDoc.maxAmount) {
      return res.status(400).json({ 
        message: `Requested amount cannot exceed scheme maximum of ₹${schemeDoc.maxAmount}` 
      });
    }

    // Check if user has access to create application for this beneficiary
    if (!hasAccessToBeneficiary(req.user, beneficiaryDoc)) {
      return res.status(403).json({ message: 'Access denied for this beneficiary' });
    }

    const application = new Application({
      beneficiary,
      scheme,
      project,
      requestedAmount,
      documents: documents || [],
      state: beneficiaryDoc.state,
      district: beneficiaryDoc.district,
      area: beneficiaryDoc.area,
      unit: beneficiaryDoc.unit,
      createdBy: req.user.id
    });

    await application.save();

    // Add application to beneficiary's applications array
    beneficiaryDoc.applications.push(application._id);
    await beneficiaryDoc.save();

    const populatedApplication = await Application.findById(application._id)
      .populate('beneficiary', 'name phone')
      .populate('scheme', 'name code')
      .populate('project', 'name code')
      .populate('createdBy', 'name');

    res.status(201).json(populatedApplication);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has access to update this application
    if (!hasAccessToApplication(req.user, application)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { requestedAmount, documents, status } = req.body;

    // Only allow certain status transitions
    if (status && !isValidStatusTransition(application.status, status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${application.status} to ${status}` 
      });
    }

    // Update fields
    if (requestedAmount !== undefined) {
      // Verify against scheme limits
      const scheme = await Scheme.findById(application.scheme);
      if (requestedAmount > scheme.maxAmount) {
        return res.status(400).json({ 
          message: `Requested amount cannot exceed scheme maximum of ₹${scheme.maxAmount}` 
        });
      }
      application.requestedAmount = requestedAmount;
    }
    
    if (documents) application.documents = documents;
    if (status) application.status = status;
    
    application.updatedBy = req.user.id;

    await application.save();

    const updatedApplication = await Application.findById(application._id)
      .populate('beneficiary', 'name phone')
      .populate('scheme', 'name code')
      .populate('project', 'name code')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    res.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Review application
const reviewApplication = async (req, res) => {
  try {
    const { status, comments } = req.body;

    if (!['under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid review status' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has access to review this application
    if (!hasAccessToApplication(req.user, application)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only pending applications can be reviewed
    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending applications can be reviewed' 
      });
    }

    application.status = status;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    application.reviewComments = comments;
    application.updatedBy = req.user.id;

    await application.save();

    const reviewedApplication = await Application.findById(application._id)
      .populate('beneficiary', 'name phone')
      .populate('scheme', 'name code')
      .populate('project', 'name code')
      .populate('reviewedBy', 'name');

    res.json(reviewedApplication);
  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve application
const approveApplication = async (req, res) => {
  try {
    const { approvedAmount, comments } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has access to approve this application
    if (!hasAccessToApplication(req.user, application)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only under_review applications can be approved
    if (application.status !== 'under_review') {
      return res.status(400).json({ 
        message: 'Only applications under review can be approved' 
      });
    }

    // Validate approved amount
    if (approvedAmount > application.requestedAmount) {
      return res.status(400).json({ 
        message: 'Approved amount cannot exceed requested amount' 
      });
    }

    application.status = 'approved';
    application.approvedAmount = approvedAmount;
    application.approvedBy = req.user.id;
    application.approvedAt = new Date();
    application.approvalComments = comments;
    application.updatedBy = req.user.id;

    await application.save();

    const approvedApplication = await Application.findById(application._id)
      .populate('beneficiary', 'name phone')
      .populate('scheme', 'name code')
      .populate('project', 'name code')
      .populate('approvedBy', 'name');

    res.json(approvedApplication);
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has access to delete this application
    if (!hasAccessToApplication(req.user, application)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only pending applications can be deleted
    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending applications can be deleted' 
      });
    }

    // Remove application from beneficiary's applications array
    await Beneficiary.findByIdAndUpdate(
      application.beneficiary,
      { $pull: { applications: application._id } }
    );

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper functions
const getUserRegionalFilter = (user) => {
  console.log('🔍 getUserRegionalFilter called with user:', {
    role: user.role,
    adminScope: user.adminScope
  });
  
  const filter = {};
  
  // Super admin has access to all applications
  if (user.role === 'super_admin') {
    console.log('🔍 Super admin - no restrictions');
    return filter; // No restrictions
  }
  
  // For other admin roles, check their adminScope.regions
  if (user.adminScope?.regions && user.adminScope.regions.length > 0) {
    const regions = user.adminScope.regions;
    console.log('🔍 User has regions:', regions);
    
    if (user.role === 'state_admin') {
      // State admin can see applications from their state
      filter.state = { $in: regions };
      console.log('🔍 State admin filter applied:', filter);
    } else if (user.role === 'district_admin') {
      // District admin can see applications from their district
      filter.district = { $in: regions };
      console.log('🔍 District admin filter applied:', filter);
    } else if (user.role === 'area_admin') {
      // Area admin can see applications from their area
      filter.area = { $in: regions };
      console.log('🔍 Area admin filter applied:', filter);
    } else if (user.role === 'unit_admin') {
      // Unit admin can see applications from their unit
      filter.unit = { $in: regions };
      console.log('🔍 Unit admin filter applied:', filter);
    }
  } else {
    console.log('🔍 No adminScope.regions found for user');
  }
  
  return filter;
};

const hasAccessToApplication = (user, application) => {
  if (user.role === 'super_admin') return true;
  
  // Check if user has access based on their adminScope.regions
  if (user.adminScope?.regions && user.adminScope.regions.length > 0) {
    const userRegions = user.adminScope.regions.map(r => r.toString());
    
    if (user.role === 'state_admin') {
      return userRegions.includes(application.state?.toString());
    } else if (user.role === 'district_admin') {
      return userRegions.includes(application.district?.toString());
    } else if (user.role === 'area_admin') {
      return userRegions.includes(application.area?.toString());
    } else if (user.role === 'unit_admin') {
      return userRegions.includes(application.unit?.toString());
    }
  }
  
  return false;
};

const hasAccessToBeneficiary = (user, beneficiary) => {
  if (user.role === 'super_admin') return true;
  
  // Check if user has access based on their adminScope.regions
  if (user.adminScope?.regions && user.adminScope.regions.length > 0) {
    const userRegions = user.adminScope.regions.map(r => r.toString());
    
    if (user.role === 'state_admin') {
      return userRegions.includes(beneficiary.state?.toString());
    } else if (user.role === 'district_admin') {
      return userRegions.includes(beneficiary.district?.toString());
    } else if (user.role === 'area_admin') {
      return userRegions.includes(beneficiary.area?.toString());
    } else if (user.role === 'unit_admin') {
      return userRegions.includes(beneficiary.unit?.toString());
    }
  }
  
  return false;
};

const isValidStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'pending': ['under_review', 'rejected'],
    'under_review': ['approved', 'rejected'],
    'approved': ['completed'],
    'rejected': [],
    'completed': []
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  reviewApplication,
  approveApplication,
  deleteApplication
};