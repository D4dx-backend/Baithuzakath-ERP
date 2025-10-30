const { FormConfiguration, Scheme } = require('../models');
const ResponseHelper = require('../utils/responseHelper');

class FormConfigurationController {
  /**
   * Get form configuration for a scheme
   * GET /api/schemes/:schemeId/form-config
   */
  async getFormConfiguration(req, res) {
    try {
      const { schemeId } = req.params;

      // First, verify the scheme exists and user has access
      const scheme = await Scheme.findById(schemeId);
      
      if (!scheme) {
        return ResponseHelper.error(res, 'Scheme not found', 404);
      }

      // Check if user can access this scheme
      if (!scheme.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied', 403);
      }

      // Try to find existing form configuration
      let formConfig = await FormConfiguration.findOne({ scheme: schemeId })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      // If no form configuration exists, return empty state
      if (!formConfig) {
        return ResponseHelper.success(res, { 
          formConfiguration: null,
          hasConfiguration: false,
          message: 'No form configuration found for this scheme.'
        });
      }

      return ResponseHelper.success(res, { 
        formConfiguration: formConfig,
        hasConfiguration: true
      });
    } catch (error) {
      console.error('❌ Get Form Configuration Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch form configuration', 500);
    }
  }

  /**
   * Create or update form configuration for a scheme
   * PUT /api/schemes/:schemeId/form-config
   */
  async updateFormConfiguration(req, res) {
    try {
      const { schemeId } = req.params;
      const formData = req.body;

      // First, verify the scheme exists and user has access
      const scheme = await Scheme.findById(schemeId);
      
      if (!scheme) {
        return ResponseHelper.error(res, 'Scheme not found', 404);
      }

      // Check if user can access this scheme
      if (!scheme.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied', 403);
      }

      // Validate required fields
      if (!formData.title || !formData.description) {
        return ResponseHelper.error(res, 'Form title and description are required', 400);
      }

      if (!formData.pages || !Array.isArray(formData.pages) || formData.pages.length === 0) {
        return ResponseHelper.error(res, 'At least one page is required', 400);
      }

      // Try to find existing form configuration
      let formConfig = await FormConfiguration.findOne({ scheme: schemeId });

      if (formConfig) {
        // Update existing configuration
        Object.assign(formConfig, {
          ...formData,
          scheme: schemeId,
          updatedBy: req.user._id,
          lastModified: new Date(),
          version: formConfig.version + 1
        });
      } else {
        // Create new configuration
        formConfig = new FormConfiguration({
          ...formData,
          scheme: schemeId,
          createdBy: req.user._id,
          updatedBy: req.user._id,
          version: 1
        });
      }

      await formConfig.save();

      // Populate user references for response
      await formConfig.populate('createdBy', 'name email');
      await formConfig.populate('updatedBy', 'name email');

      return ResponseHelper.success(res, { 
        message: 'Form configuration saved successfully',
        formConfiguration: formConfig 
      });
    } catch (error) {
      console.error('❌ Update Form Configuration Error:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return ResponseHelper.error(res, `Validation failed: ${validationErrors.join(', ')}`, 400);
      }
      
      // Handle custom validation errors from pre-save middleware
      if (error.message && error.message.includes('Form validation failed')) {
        return ResponseHelper.error(res, error.message, 400);
      }

      return ResponseHelper.error(res, 'Failed to save form configuration', 500);
    }
  }

  /**
   * Delete form configuration for a scheme
   * DELETE /api/schemes/:schemeId/form-config
   */
  async deleteFormConfiguration(req, res) {
    try {
      const { schemeId } = req.params;

      // First, verify the scheme exists and user has access
      const scheme = await Scheme.findById(schemeId);
      
      if (!scheme) {
        return ResponseHelper.error(res, 'Scheme not found', 404);
      }

      // Check if user can access this scheme
      if (!scheme.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied', 403);
      }

      // Find and delete the form configuration
      const formConfig = await FormConfiguration.findOneAndDelete({ scheme: schemeId });

      if (!formConfig) {
        return ResponseHelper.error(res, 'Form configuration not found', 404);
      }

      // Update scheme status
      await Scheme.findByIdAndUpdate(schemeId, {
        hasFormConfiguration: false,
        formConfigurationUpdated: null
      });

      return ResponseHelper.success(res, { 
        message: 'Form configuration deleted successfully' 
      });
    } catch (error) {
      console.error('❌ Delete Form Configuration Error:', error);
      return ResponseHelper.error(res, 'Failed to delete form configuration', 500);
    }
  }

  /**
   * Publish/Unpublish form configuration
   * PATCH /api/schemes/:schemeId/form-config/publish
   */
  async togglePublishStatus(req, res) {
    try {
      const { schemeId } = req.params;
      const { isPublished } = req.body;

      // First, verify the scheme exists and user has access
      const scheme = await Scheme.findById(schemeId);
      
      if (!scheme) {
        return ResponseHelper.error(res, 'Scheme not found', 404);
      }

      // Check if user can access this scheme
      if (!scheme.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied', 403);
      }

      // Find the form configuration
      const formConfig = await FormConfiguration.findOne({ scheme: schemeId });

      if (!formConfig) {
        return ResponseHelper.error(res, 'Form configuration not found', 404);
      }

      // Update publish status
      formConfig.isPublished = isPublished;
      formConfig.publishedAt = isPublished ? new Date() : null;
      formConfig.updatedBy = req.user._id;

      await formConfig.save();

      return ResponseHelper.success(res, { 
        message: `Form configuration ${isPublished ? 'published' : 'unpublished'} successfully`,
        formConfiguration: formConfig 
      });
    } catch (error) {
      console.error('❌ Toggle Publish Status Error:', error);
      return ResponseHelper.error(res, 'Failed to update publish status', 500);
    }
  }

  /**
   * Get form configuration analytics
   * GET /api/schemes/:schemeId/form-config/analytics
   */
  async getFormAnalytics(req, res) {
    try {
      const { schemeId } = req.params;

      // First, verify the scheme exists and user has access
      const scheme = await Scheme.findById(schemeId);
      
      if (!scheme) {
        return ResponseHelper.error(res, 'Scheme not found', 404);
      }

      // Check if user can access this scheme
      if (!scheme.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied', 403);
      }

      // Find the form configuration
      const formConfig = await FormConfiguration.findOne({ scheme: schemeId })
        .select('analytics totalFields requiredFields formUrl');

      if (!formConfig) {
        return ResponseHelper.error(res, 'Form configuration not found', 404);
      }

      return ResponseHelper.success(res, { 
        analytics: {
          ...formConfig.analytics,
          totalFields: formConfig.totalFields,
          requiredFields: formConfig.requiredFields,
          formUrl: formConfig.formUrl
        }
      });
    } catch (error) {
      console.error('❌ Get Form Analytics Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch form analytics', 500);
    }
  }

  /**
   * Get all form configurations (for admin)
   * GET /api/form-configurations
   */
  async getAllFormConfigurations(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        enabled,
        published
      } = req.query;

      // Build filter query
      const filter = {};
      
      if (enabled !== undefined) filter.enabled = enabled === 'true';
      if (published !== undefined) filter.isPublished = published === 'true';
      
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const formConfigs = await FormConfiguration.find(filter)
        .populate('scheme', 'name code category status')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ lastModified: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await FormConfiguration.countDocuments(filter);

      return ResponseHelper.success(res, {
        formConfigurations: formConfigs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Get All Form Configurations Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch form configurations', 500);
    }
  }

  /**
   * Duplicate form configuration to another scheme
   * POST /api/schemes/:schemeId/form-config/duplicate
   */
  async duplicateFormConfiguration(req, res) {
    try {
      const { schemeId } = req.params;
      const { targetSchemeId } = req.body;

      if (!targetSchemeId) {
        return ResponseHelper.error(res, 'Target scheme ID is required', 400);
      }

      // Verify both schemes exist and user has access
      const [sourceScheme, targetScheme] = await Promise.all([
        Scheme.findById(schemeId),
        Scheme.findById(targetSchemeId)
      ]);

      if (!sourceScheme) {
        return ResponseHelper.error(res, 'Source scheme not found', 404);
      }

      if (!targetScheme) {
        return ResponseHelper.error(res, 'Target scheme not found', 404);
      }

      if (!sourceScheme.canUserAccess(req.user) || !targetScheme.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied', 403);
      }

      // Find source form configuration
      const sourceFormConfig = await FormConfiguration.findOne({ scheme: schemeId });

      if (!sourceFormConfig) {
        return ResponseHelper.error(res, 'Source form configuration not found', 404);
      }

      // Check if target already has a form configuration
      const existingTargetConfig = await FormConfiguration.findOne({ scheme: targetSchemeId });
      if (existingTargetConfig) {
        return ResponseHelper.error(res, 'Target scheme already has a form configuration', 400);
      }

      // Create duplicate configuration
      const duplicateConfig = new FormConfiguration({
        ...sourceFormConfig.toObject(),
        _id: undefined,
        scheme: targetSchemeId,
        title: `${targetScheme.name} Application Form`,
        description: `Application form for ${targetScheme.name} scheme.`,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        version: 1,
        isPublished: false,
        publishedAt: null,
        analytics: {
          totalViews: 0,
          totalSubmissions: 0,
          completionRate: 0,
          averageTimeToComplete: 0
        }
      });

      await duplicateConfig.save();

      return ResponseHelper.success(res, { 
        message: 'Form configuration duplicated successfully',
        formConfiguration: duplicateConfig 
      });
    } catch (error) {
      console.error('❌ Duplicate Form Configuration Error:', error);
      return ResponseHelper.error(res, 'Failed to duplicate form configuration', 500);
    }
  }
}

module.exports = new FormConfigurationController();