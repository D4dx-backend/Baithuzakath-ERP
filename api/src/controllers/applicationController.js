const Application = require('../models/Application');
const Beneficiary = require('../models/Beneficiary');
const Scheme = require('../models/Scheme');
const Project = require('../models/Project');
const MasterData = require('../models/MasterData');
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
    
    // Apply regional filtering (super_admin and state_admin have no restrictions)
    Object.assign(filter, userRegionalFilter);
    
    console.log('🔍 Final filter:', filter);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Check total applications in database
    const totalApplicationsInDB = await Application.countDocuments();
    console.log('🔍 Total applications in database:', totalApplicationsInDB);
    
    const applications = await Application.find(filter)
      .populate('beneficiary', 'name phone')
      .populate('scheme', 'name code maxAmount distributionTimeline')
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
      .populate('scheme', 'name code maxAmount distributionTimeline')
      .populate('project')
      .populate('state', 'name code')
      .populate('district', 'name code')
      .populate('area', 'name code')
      .populate('unit', 'name code')
      .populate('createdBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name');

    if (!application) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user has access to this application
    if (!hasAccessToApplication(req.user, application)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Application retrieved successfully',
      data: application,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      timestamp: new Date().toISOString()
    });
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

    // Generate distribution timeline based on scheme configuration
    const distributionTimeline = await generateDistributionTimeline(schemeDoc, requestedAmount);

    // Initialize application with scheme-based workflow stages
    const applicationStages = getApplicationStagesFromScheme(schemeDoc);

    const application = new Application({
      beneficiary,
      scheme,
      project,
      requestedAmount,
      documents: documents || [],
      distributionTimeline,
      applicationStages, // Add the workflow stages
      currentStage: applicationStages.length > 0 ? applicationStages[0].name : 'Application Received',
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
      .populate('scheme', 'name code distributionTimeline')
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
      .populate('scheme', 'name code distributionTimeline')
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
      .populate('scheme', 'name code distributionTimeline')
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

    // Update distribution timeline with actual approved amount and dates
    await updateDistributionTimelineOnApproval(application, approvedAmount);

    await application.save();

    const approvedApplication = await Application.findById(application._id)
      .populate('beneficiary', 'name phone')
      .populate('scheme', 'name code distributionTimeline')
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
  
  // Super admin and state admin have access to all applications
  if (user.role === 'super_admin' || user.role === 'state_admin') {
    console.log(`🔍 ${user.role} - no restrictions`);
    return filter; // No restrictions
  }
  
  // For other admin roles, check their adminScope.regions
  if (user.adminScope?.regions && user.adminScope.regions.length > 0) {
    const regions = user.adminScope.regions;
    console.log('🔍 User has regions:', regions);
    
    if (user.role === 'district_admin') {
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
  if (user.role === 'super_admin' || user.role === 'state_admin') return true;
  
  // Check if user has access based on their adminScope.regions
  if (user.adminScope?.regions && user.adminScope.regions.length > 0) {
    const userRegions = user.adminScope.regions.map(r => r.toString());
    
    if (user.role === 'district_admin') {
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

// Get application stages from scheme configuration
const getApplicationStagesFromScheme = (scheme) => {
  try {
    let stages = [];

    // Use scheme's custom stages if available
    if (scheme.statusStages && scheme.statusStages.length > 0) {
      stages = [...scheme.statusStages];
    } else {
      // Use default application stages
      stages = [
        {
          name: "Application Received",
          description: "Initial application submission and registration",
          order: 1,
          isRequired: true,
          allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'],
          autoTransition: true,
          transitionConditions: "Automatically set when application is submitted"
        },
        {
          name: "Document Verification",
          description: "Verification of submitted documents and eligibility",
          order: 2,
          isRequired: true,
          allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'],
          autoTransition: false,
          transitionConditions: ""
        },
        {
          name: "Field Verification",
          description: "Physical verification and field assessment",
          order: 3,
          isRequired: false,
          allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'],
          autoTransition: false,
          transitionConditions: ""
        },
        {
          name: "Interview Process",
          description: "Beneficiary interview and assessment",
          order: 4,
          isRequired: scheme.applicationSettings?.requiresInterview || false,
          allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin', 'scheme_coordinator'],
          autoTransition: false,
          transitionConditions: ""
        },
        {
          name: "Final Review",
          description: "Final review and decision making",
          order: 5,
          isRequired: true,
          allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin'],
          autoTransition: false,
          transitionConditions: ""
        },
        {
          name: "Approved",
          description: "Application approved for disbursement",
          order: 6,
          isRequired: true,
          allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin'],
          autoTransition: false,
          transitionConditions: ""
        },
        {
          name: "Disbursement",
          description: "Money disbursement to beneficiary",
          order: 7,
          isRequired: true,
          allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin'],
          autoTransition: false,
          transitionConditions: ""
        },
        {
          name: "Completed",
          description: "Application process completed successfully",
          order: 8,
          isRequired: true,
          allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin'],
          autoTransition: true,
          transitionConditions: "Automatically set when all disbursements are complete"
        }
      ];
    }

    // Modify stages based on scheme settings
    if (!scheme.applicationSettings?.requiresInterview) {
      // Mark interview stage as not required
      stages = stages.map(stage => 
        stage.name === "Interview Process" 
          ? { ...stage, isRequired: false }
          : stage
      );
    }

    return stages.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error getting application stages from scheme:', error);
    return [];
  }
};

// Generate distribution timeline based on scheme configuration
const generateDistributionTimeline = async (scheme, requestedAmount) => {
  try {
    let timeline = [];

    // First, check if scheme has its own distribution timeline
    if (scheme.distributionTimeline && scheme.distributionTimeline.length > 0) {
      timeline = scheme.distributionTimeline.map(step => ({
        description: step.description,
        amount: Math.round((requestedAmount * step.percentage) / 100),
        percentage: step.percentage,
        expectedDate: new Date(Date.now() + (step.daysFromApproval * 24 * 60 * 60 * 1000)),
        status: 'pending',
        notes: step.notes
      }));
    } else {
      // Look for master data distribution timeline templates
      const distributionTemplate = await MasterData.findOne({
        type: 'distribution_timeline_templates',
        status: 'active',
        $or: [
          { scope: 'global' },
          { scope: 'scheme_specific', targetSchemes: scheme._id }
        ]
      }).sort({ scope: -1 }); // Prefer scheme-specific over global

      if (distributionTemplate && distributionTemplate.configuration.distributionSteps) {
        timeline = distributionTemplate.configuration.distributionSteps.map(step => ({
          description: step.description,
          amount: Math.round((requestedAmount * step.percentage) / 100),
          percentage: step.percentage,
          expectedDate: new Date(Date.now() + (step.daysFromApproval * 24 * 60 * 60 * 1000)),
          status: 'pending',
          notes: step.notes
        }));
      } else {
        // Default timeline if no configuration found
        timeline = [
          {
            description: 'Initial Payment',
            amount: requestedAmount,
            percentage: 100,
            expectedDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
            status: 'pending',
            notes: 'Full amount disbursement'
          }
        ];
      }
    }

    return timeline;
  } catch (error) {
    console.error('Error generating distribution timeline:', error);
    // Return default timeline on error
    return [
      {
        description: 'Initial Payment',
        amount: requestedAmount,
        percentage: 100,
        expectedDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
        status: 'pending',
        notes: 'Full amount disbursement'
      }
    ];
  }
};

// Update distribution timeline when application is approved
const updateDistributionTimelineOnApproval = async (application, approvedAmount) => {
  try {
    const approvalDate = new Date();
    
    // Get the latest scheme configuration to ensure we use current timeline settings
    const Scheme = require('../models/Scheme');
    const scheme = await Scheme.findById(application.scheme);
    
    if (scheme && scheme.distributionTimeline && scheme.distributionTimeline.length > 0) {
      // Regenerate timeline based on current scheme configuration
      application.distributionTimeline = scheme.distributionTimeline.map(step => ({
        description: step.description,
        amount: Math.round((approvedAmount * step.percentage) / 100),
        percentage: step.percentage,
        expectedDate: new Date(approvalDate.getTime() + (step.daysFromApproval * 24 * 60 * 60 * 1000)),
        status: 'pending',
        notes: step.notes || '',
        isAutomatic: step.isAutomatic || false,
        requiresVerification: step.requiresVerification !== false
      }));
    } else {
      // Fallback: Update existing timeline with approved amount and recalculate dates from approval date
      application.distributionTimeline = application.distributionTimeline.map(step => {
        const updatedStep = { ...step };
        
        // Recalculate amount based on approved amount
        updatedStep.amount = Math.round((approvedAmount * step.percentage) / 100);
        
        // Recalculate expected date from approval date
        // Extract days from original expected date calculation
        const originalDays = Math.ceil((step.expectedDate - application.createdAt) / (24 * 60 * 60 * 1000));
        updatedStep.expectedDate = new Date(approvalDate.getTime() + (originalDays * 24 * 60 * 60 * 1000));
        
        return updatedStep;
      });
    }

    // Add timeline update to stage history
    if (!application.stageHistory) {
      application.stageHistory = [];
    }
    
    application.stageHistory.push({
      stageName: 'Distribution Timeline Updated',
      status: 'completed',
      timestamp: approvalDate,
      updatedBy: application.approvedBy,
      notes: `Distribution timeline updated with approved amount: ₹${approvedAmount.toLocaleString()}`
    });

    return application.distributionTimeline;
  } catch (error) {
    console.error('Error updating distribution timeline:', error);
    return application.distributionTimeline;
  }
};

// Update all applications when scheme distribution timeline is modified
const updateApplicationsDistributionTimeline = async (schemeId, newDistributionTimeline, updatedBy) => {
  try {
    const Application = require('../models/Application');
    
    // Find all approved applications for this scheme that haven't been completed
    const applications = await Application.find({
      scheme: schemeId,
      status: { $in: ['approved', 'disbursed'] }, // Only update approved/disbursed applications
      'distributionTimeline.status': { $ne: 'completed' } // Don't update if all payments are completed
    });

    console.log(`Found ${applications.length} applications to update for scheme ${schemeId}`);

    const updatePromises = applications.map(async (application) => {
      try {
        // Regenerate timeline based on new scheme configuration
        const updatedTimeline = newDistributionTimeline.map(step => {
          // Find existing step to preserve payment status if already processed
          const existingStep = application.distributionTimeline.find(
            existing => existing.description === step.description || 
                       existing.percentage === step.percentage
          );

          return {
            description: step.description,
            amount: Math.round((application.approvedAmount * step.percentage) / 100),
            percentage: step.percentage,
            expectedDate: existingStep && existingStep.status === 'completed' 
              ? existingStep.expectedDate 
              : new Date(application.approvedAt.getTime() + (step.daysFromApproval * 24 * 60 * 60 * 1000)),
            status: existingStep ? existingStep.status : 'pending',
            actualDate: existingStep ? existingStep.actualDate : undefined,
            paymentId: existingStep ? existingStep.paymentId : undefined,
            notes: step.notes || existingStep?.notes || '',
            isAutomatic: step.isAutomatic || false,
            requiresVerification: step.requiresVerification !== false
          };
        });

        // Update the application
        application.distributionTimeline = updatedTimeline;
        
        // Add to stage history
        if (!application.stageHistory) {
          application.stageHistory = [];
        }
        
        application.stageHistory.push({
          stageName: 'Distribution Timeline Updated',
          status: 'completed',
          timestamp: new Date(),
          updatedBy: updatedBy,
          notes: 'Distribution timeline updated due to scheme configuration change'
        });

        await application.save();
        console.log(`Updated distribution timeline for application ${application._id}`);
        
        return { success: true, applicationId: application._id };
      } catch (error) {
        console.error(`Error updating application ${application._id}:`, error);
        return { success: false, applicationId: application._id, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Distribution timeline update completed: ${successful} successful, ${failed} failed`);
    
    return {
      success: true,
      updated: successful,
      failed: failed,
      total: applications.length,
      results: results
    };
  } catch (error) {
    console.error('Error updating applications distribution timeline:', error);
    return {
      success: false,
      error: error.message,
      updated: 0,
      failed: 0,
      total: 0
    };
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  reviewApplication,
  approveApplication,
  deleteApplication,
  generateDistributionTimeline,
  updateDistributionTimelineOnApproval,
  updateApplicationsDistributionTimeline
};