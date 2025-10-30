const { Project, User, Location } = require('../models');
const ResponseHelper = require('../utils/responseHelper');

class ProjectController {
  /**
   * Get all projects with filtering and pagination
   * GET /api/projects
   */
  async getProjects(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        category,
        priority,
        scope,
        coordinator,
        search
      } = req.query;

      // Build filter query
      const filter = {};
      
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      if (scope) filter.scope = scope;
      if (coordinator) filter.coordinator = coordinator;
      
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
          filter.targetRegions = { $in: userRegions };
        }
      }

      const skip = (page - 1) * limit;
      
      const projects = await Project.find(filter)
        .populate('coordinator', 'name email phone role')
        .populate('targetRegions', 'name type code')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Project.countDocuments(filter);

      return ResponseHelper.success(res, {
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Get Projects Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch projects', 500);
    }
  }

  /**
   * Get project by ID
   * GET /api/projects/:id
   */
  async getProjectById(req, res) {
    try {
      const { id } = req.params;

      const project = await Project.findById(id)
        .populate('coordinator', 'name email phone role profile')
        .populate('targetRegions', 'name type code parent')
        .populate('team.user', 'name email phone role')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!project) {
        return ResponseHelper.error(res, 'Project not found', 404);
      }

      // Check access permissions
      if (!project.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied to this project', 403);
      }

      return ResponseHelper.success(res, { project });
    } catch (error) {
      console.error('❌ Get Project Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch project', 500);
    }
  }

  /**
   * Create new project
   * POST /api/projects
   */
  async createProject(req, res) {
    try {
      const projectData = {
        ...req.body,
        createdBy: req.user._id
      };

      // Validate coordinator exists
      if (projectData.coordinator) {
        const coordinator = await User.findById(projectData.coordinator);
        if (!coordinator) {
          return ResponseHelper.error(res, 'Invalid coordinator specified', 400);
        }
      }

      // Validate target regions exist
      if (projectData.targetRegions && projectData.targetRegions.length > 0) {
        const regions = await Location.find({ _id: { $in: projectData.targetRegions } });
        if (regions.length !== projectData.targetRegions.length) {
          return ResponseHelper.error(res, 'One or more invalid target regions specified', 400);
        }
      }

      const project = new Project(projectData);
      await project.save();

      const populatedProject = await Project.findById(project._id)
        .populate('coordinator', 'name email phone role')
        .populate('targetRegions', 'name type code')
        .populate('createdBy', 'name email');

      return ResponseHelper.success(res, { project: populatedProject }, 'Project created successfully', 201);
    } catch (error) {
      console.error('❌ Create Project Error:', error);
      
      if (error.code === 11000) {
        return ResponseHelper.error(res, 'Project code already exists', 400);
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return ResponseHelper.error(res, messages.join(', '), 400);
      }
      
      return ResponseHelper.error(res, 'Failed to create project', 500);
    }
  }

  /**
   * Update project
   * PUT /api/projects/:id
   */
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user._id
      };

      const project = await Project.findById(id);
      if (!project) {
        return ResponseHelper.error(res, 'Project not found', 404);
      }

      // Check access permissions
      if (!project.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied to this project', 403);
      }

      // Validate coordinator if being updated
      if (updateData.coordinator) {
        const coordinator = await User.findById(updateData.coordinator);
        if (!coordinator) {
          return ResponseHelper.error(res, 'Invalid coordinator specified', 400);
        }
      }

      // Validate target regions if being updated
      if (updateData.targetRegions && updateData.targetRegions.length > 0) {
        const regions = await Location.find({ _id: { $in: updateData.targetRegions } });
        if (regions.length !== updateData.targetRegions.length) {
          return ResponseHelper.error(res, 'One or more invalid target regions specified', 400);
        }
      }

      Object.assign(project, updateData);
      await project.save();

      const populatedProject = await Project.findById(project._id)
        .populate('coordinator', 'name email phone role')
        .populate('targetRegions', 'name type code')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      return ResponseHelper.success(res, { project: populatedProject }, 'Project updated successfully');
    } catch (error) {
      console.error('❌ Update Project Error:', error);
      
      if (error.code === 11000) {
        return ResponseHelper.error(res, 'Project code already exists', 400);
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return ResponseHelper.error(res, messages.join(', '), 400);
      }
      
      return ResponseHelper.error(res, 'Failed to update project', 500);
    }
  }

  /**
   * Delete project
   * DELETE /api/projects/:id
   */
  async deleteProject(req, res) {
    try {
      const { id } = req.params;

      const project = await Project.findById(id);
      if (!project) {
        return ResponseHelper.error(res, 'Project not found', 404);
      }

      // Check access permissions
      if (!project.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied to this project', 403);
      }

      // Check if project can be deleted (no active applications, etc.)
      // This would need to be implemented based on business rules

      await Project.findByIdAndDelete(id);

      return ResponseHelper.success(res, null, 'Project deleted successfully');
    } catch (error) {
      console.error('❌ Delete Project Error:', error);
      return ResponseHelper.error(res, 'Failed to delete project', 500);
    }
  }

  /**
   * Get project statistics
   * GET /api/projects/stats
   */
  async getProjectStats(req, res) {
    try {
      // Build filter based on user access
      const filter = {};
      if (req.user.role !== 'super_admin' && req.user.role !== 'state_admin') {
        const userRegions = req.user.adminScope?.regions || [];
        if (userRegions.length > 0) {
          filter.targetRegions = { $in: userRegions };
        }
      }

      const stats = await Project.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            totalBudget: { $sum: '$budget.total' },
            totalAllocated: { $sum: '$budget.allocated' },
            totalSpent: { $sum: '$budget.spent' },
            activeProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            completedProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalBeneficiaries: { $sum: '$targetBeneficiaries.actual' }
          }
        }
      ]);

      const categoryStats = await Project.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget.total' },
            totalBeneficiaries: { $sum: '$targetBeneficiaries.actual' }
          }
        }
      ]);

      const statusStats = await Project.aggregate([
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
          totalProjects: 0,
          totalBudget: 0,
          totalAllocated: 0,
          totalSpent: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalBeneficiaries: 0
        },
        byCategory: categoryStats,
        byStatus: statusStats
      });
    } catch (error) {
      console.error('❌ Get Project Stats Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch project statistics', 500);
    }
  }

  /**
   * Update project progress
   * PUT /api/projects/:id/progress
   */
  async updateProgress(req, res) {
    try {
      const { id } = req.params;
      const { milestones, percentage } = req.body;

      const project = await Project.findById(id);
      if (!project) {
        return ResponseHelper.error(res, 'Project not found', 404);
      }

      // Check access permissions
      if (!project.canUserAccess(req.user)) {
        return ResponseHelper.error(res, 'Access denied to this project', 403);
      }

      if (milestones) {
        project.progress.milestones = milestones;
      }

      if (percentage !== undefined) {
        project.progress.percentage = percentage;
      }

      project.updatedBy = req.user._id;
      await project.save();

      return ResponseHelper.success(res, { project }, 'Project progress updated successfully');
    } catch (error) {
      console.error('❌ Update Progress Error:', error);
      return ResponseHelper.error(res, 'Failed to update project progress', 500);
    }
  }
}

module.exports = new ProjectController();