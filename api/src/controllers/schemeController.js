const { Scheme, Project, Location } = require('../models');
const ResponseHelper = require('../utils/responseHelper');
const formConfigurationController = require('./formConfigurationController');

class SchemeController {
  /**
   * Get all schemes with filtering and pagination
   * GET /api/schemes
   */
  async getSchemes(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        category,
        project,
        priority,
        search
      } = req.query;

      // Build filter query
      const filter = {};
      
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (project) filter.project = project;
      if (priority) filter.priority = priority;
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Apply regional access control
      if (req.user.role !== 'super_admin' && req.user.role !== 'state_admin') {
        const userRegions = req.user.adminScope?.regions || [];
        if (userRegions.length > 0) {
          // Include schemes with no target regions (applicable to all) or schemes in user's regions
          const regionalFilter = [
            { targetRegions: { $size: 0 } }, // Schemes applicable to all regions
            { targetRegions: { $in: userRegions } } // Schemes in user's regions
          ];
          
          // Merge with existing $or filter if present
          if (filter.$or) {
            filter.$and = [
              { $or: filter.$or },
              { $or: regionalFilter }
            ];
            delete filter.$or;
          } else {
            filter.$or = regionalFilter;
          }
        }
      }

      const skip = (page - 1) * limit;
      
      const schemes = await Scheme.find(filter)
        .populate('project', 'name code description')
        .populate('targetRegions', 'name type code')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Scheme.countDocuments(filter);

      return ResponseHelper.success(res, {
        schemes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Get Schemes Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch schemes', 500);
    }
  }

  /**
   * Get scheme by ID
   * GET /api/schemes/:id
   */
  async getSchemeById(req, res) {
    try {
      const { id } = req.params;

      const scheme = await Scheme.findById(id)
        .populate('project', 'name code description coordinator')
        .populate('targetRegions', 'name type code parent')
        .populate('createdBy', 'name email profile')
        .populate('updatedBy', 'name email');

      if (!scheme) {
        return ResponseHelper.error(res, 'Scheme not found', 404);
      }

      // Check access permissions
      if (!scheme.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied to this scheme', 403);
      }

      return ResponseHelper.success(res, { scheme });
    } catch (error) {
      console.error('❌ Get Scheme Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch scheme', 500);
    }
  }

  /**
   * Create new scheme
   * POST /api/schemes
   */
  async createScheme(req, res) {
    try {
      const schemeData = {
        ...req.body,
        createdBy: req.user._id
      };

      // Validate project exists
      if (schemeData.project) {
        const project = await Project.findById(schemeData.project);
        if (!project) {
          return ResponseHelper.error(res, 'Invalid project specified', 400);
        }
      }

      // Validate target regions exist (if provided)
      if (schemeData.targetRegions && schemeData.targetRegions.length > 0) {
        const regions = await Location.find({ _id: { $in: schemeData.targetRegions } });
        if (regions.length !== schemeData.targetRegions.length) {
          return ResponseHelper.error(res, 'One or more invalid target regions specified', 400);
        }
      } else {
        // If no target regions specified, make it applicable to all regions
        schemeData.targetRegions = [];
      }

      const scheme = new Scheme(schemeData);
      await scheme.save();

      const populatedScheme = await Scheme.findById(scheme._id)
        .populate('project', 'name code description')
        .populate('targetRegions', 'name type code')
        .populate('createdBy', 'name email');

      return ResponseHelper.success(res, { scheme: populatedScheme }, 'Scheme created successfully', 201);
    } catch (error) {
      console.error('❌ Create Scheme Error:', error);
      
      if (error.code === 11000) {
        return ResponseHelper.error(res, 'Scheme code already exists', 400);
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return ResponseHelper.error(res, messages.join(', '), 400);
      }
      
      return ResponseHelper.error(res, 'Failed to create scheme', 500);
    }
  }

  /**
   * Update scheme
   * PUT /api/schemes/:id
   */
  async updateScheme(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user._id
      };

      const scheme = await Scheme.findById(id);
      if (!scheme) {
        return ResponseHelper.error(res, 'Scheme not found', 404);
      }

      // Check access permissions
      if (!scheme.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied to this scheme', 403);
      }

      // Validate project if being updated
      if (updateData.project) {
        const project = await Project.findById(updateData.project);
        if (!project) {
          return ResponseHelper.error(res, 'Invalid project specified', 400);
        }
      }

      // Validate target regions if being updated
      if (updateData.targetRegions && updateData.targetRegions.length > 0) {
        const regions = await Location.find({ _id: { $in: updateData.targetRegions } });
        if (regions.length !== updateData.targetRegions.length) {
          return ResponseHelper.error(res, 'One or more invalid target regions specified', 400);
        }
      } else if (updateData.targetRegions !== undefined) {
        // If explicitly set to empty, make it applicable to all regions
        updateData.targetRegions = [];
      }

      Object.assign(scheme, updateData);
      await scheme.save();

      const populatedScheme = await Scheme.findById(scheme._id)
        .populate('project', 'name code description')
        .populate('targetRegions', 'name type code')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      return ResponseHelper.success(res, { scheme: populatedScheme }, 'Scheme updated successfully');
    } catch (error) {
      console.error('❌ Update Scheme Error:', error);
      
      if (error.code === 11000) {
        return ResponseHelper.error(res, 'Scheme code already exists', 400);
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return ResponseHelper.error(res, messages.join(', '), 400);
      }
      
      return ResponseHelper.error(res, 'Failed to update scheme', 500);
    }
  }

  /**
   * Delete scheme
   * DELETE /api/schemes/:id
   */
  async deleteScheme(req, res) {
    try {
      const { id } = req.params;

      const scheme = await Scheme.findById(id);
      if (!scheme) {
        return ResponseHelper.error(res, 'Scheme not found', 404);
      }

      // Check access permissions
      if (!scheme.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied to this scheme', 403);
      }

      // Check if scheme has applications (prevent deletion if has applications)
      if (scheme.statistics.totalApplications > 0) {
        return ResponseHelper.error(res, 'Cannot delete scheme with existing applications', 400);
      }

      await Scheme.findByIdAndDelete(id);

      return ResponseHelper.success(res, null, 'Scheme deleted successfully');
    } catch (error) {
      console.error('❌ Delete Scheme Error:', error);
      return ResponseHelper.error(res, 'Failed to delete scheme', 500);
    }
  }

  /**
   * Get scheme statistics
   * GET /api/schemes/stats
   */
  async getSchemeStats(req, res) {
    try {
      // Build filter based on user access
      const filter = {};
      if (req.user.role !== 'super_admin' && req.user.role !== 'state_admin') {
        const userRegions = req.user.adminScope?.regions || [];
        if (userRegions.length > 0) {
          // Include schemes with no target regions (applicable to all) or schemes in user's regions
          filter.$or = [
            { targetRegions: { $size: 0 } }, // Schemes applicable to all regions
            { targetRegions: { $in: userRegions } } // Schemes in user's regions
          ];
        }
      }

      const stats = await Scheme.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSchemes: { $sum: 1 },
            totalBudget: { $sum: '$budget.total' },
            totalAllocated: { $sum: '$budget.allocated' },
            totalSpent: { $sum: '$budget.spent' },
            activeSchemes: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            totalApplications: { $sum: '$statistics.totalApplications' },
            totalBeneficiaries: { $sum: '$statistics.totalBeneficiaries' },
            totalAmountDisbursed: { $sum: '$statistics.totalAmountDisbursed' }
          }
        }
      ]);

      const categoryStats = await Scheme.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget.total' },
            totalBeneficiaries: { $sum: '$statistics.totalBeneficiaries' }
          }
        }
      ]);

      const statusStats = await Scheme.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return ResponseHelper.success(res, {
        overview: stats[0] || {
          totalSchemes: 0,
          totalBudget: 0,
          totalAllocated: 0,
          totalSpent: 0,
          activeSchemes: 0,
          totalApplications: 0,
          totalBeneficiaries: 0,
          totalAmountDisbursed: 0
        },
        byCategory: categoryStats,
        byStatus: statusStats
      });
    } catch (error) {
      console.error('❌ Get Scheme Stats Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch scheme statistics', 500);
    }
  }

  /**
   * Get active schemes for applications
   * GET /api/schemes/active
   */
  async getActiveSchemes(req, res) {
    try {
      const filter = {
        status: 'active',
        'applicationSettings.startDate': { $lte: new Date() },
        'applicationSettings.endDate': { $gte: new Date() }
      };

      // Apply regional access control
      if (req.user.role !== 'super_admin' && req.user.role !== 'state_admin') {
        const userRegions = req.user.adminScope?.regions || [];
        if (userRegions.length > 0) {
          // Include schemes with no target regions (applicable to all) or schemes in user's regions
          filter.$or = [
            { targetRegions: { $size: 0 } }, // Schemes applicable to all regions
            { targetRegions: { $in: userRegions } } // Schemes in user's regions
          ];
        }
      }

      const schemes = await Scheme.find(filter)
        .populate('project', 'name code')
        .populate('targetRegions', 'name type code')
        .select('name code description category benefits eligibility applicationSettings statistics')
        .sort({ 'applicationSettings.endDate': 1 });

      return ResponseHelper.success(res, { schemes });
    } catch (error) {
      console.error('❌ Get Active Schemes Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch active schemes', 500);
    }
  }

  /**
   * Get form configuration for a scheme
   * GET /api/schemes/:id/form-config
   */
  async getFormConfiguration(req, res) {
    // Delegate to FormConfiguration controller
    req.params.schemeId = req.params.id;
    return formConfigurationController.getFormConfiguration(req, res);
  }

  /**
   * Update form configuration for a scheme
   * PUT /api/schemes/:id/form-config
   */
  async updateFormConfiguration(req, res) {
    // Delegate to FormConfiguration controller
    req.params.schemeId = req.params.id;
    return formConfigurationController.updateFormConfiguration(req, res);
  }
}

module.exports = new SchemeController();