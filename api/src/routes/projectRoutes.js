const express = require('express');
const projectController = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, projectSchemas } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/projects/stats:
 *   get:
 *     summary: Get project statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project statistics retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/stats', projectController.getProjectStats);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with filtering and pagination
 *     tags: [Projects]
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
 *           enum: [draft, approved, active, on_hold, completed, cancelled]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [education, healthcare, housing, livelihood, emergency_relief, infrastructure, social_welfare, other]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [state, district, area, unit, multi_region]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/', projectController.getProjects);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - description
 *               - category
 *               - scope
 *               - targetRegions
 *               - startDate
 *               - endDate
 *               - budget
 *               - coordinator
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *               code:
 *                 type: string
 *                 pattern: '^[A-Z0-9_-]+$'
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               category:
 *                 type: string
 *                 enum: [education, healthcare, housing, livelihood, emergency_relief, infrastructure, social_welfare, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *               scope:
 *                 type: string
 *                 enum: [state, district, area, unit, multi_region]
 *               targetRegions:
 *                 type: array
 *                 items:
 *                   type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               budget:
 *                 type: object
 *                 properties:
 *                   total:
 *                     type: number
 *                     minimum: 0
 *               coordinator:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Invalid project data
 *       401:
 *         description: Authentication required
 */
router.post('/', 
  authorize('state_admin', 'district_admin', 'project_coordinator'),
  projectController.createProject
);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Authentication required
 */
router.get('/:id', projectController.getProjectById);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               category:
 *                 type: string
 *                 enum: [education, healthcare, housing, livelihood, emergency_relief, infrastructure, social_welfare, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               status:
 *                 type: string
 *                 enum: [draft, approved, active, on_hold, completed, cancelled]
 *               budget:
 *                 type: object
 *                 properties:
 *                   total:
 *                     type: number
 *                     minimum: 0
 *                   allocated:
 *                     type: number
 *                     minimum: 0
 *                   spent:
 *                     type: number
 *                     minimum: 0
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Invalid project data
 *       404:
 *         description: Project not found
 *       401:
 *         description: Authentication required
 */
router.put('/:id', 
  authorize('state_admin', 'district_admin', 'project_coordinator'),
  projectController.updateProject
);

/**
 * @swagger
 * /api/projects/{id}/progress:
 *   put:
 *     summary: Update project progress
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               milestones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     targetDate:
 *                       type: string
 *                       format: date
 *                     completedDate:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                       enum: [pending, in_progress, completed, delayed]
 *     responses:
 *       200:
 *         description: Project progress updated successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Authentication required
 */
router.put('/:id/progress', 
  authorize('state_admin', 'district_admin', 'project_coordinator', 'area_admin', 'unit_admin'),
  projectController.updateProgress
);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Authentication required
 */
router.delete('/:id', 
  authorize('state_admin', 'district_admin'),
  projectController.deleteProject
);

module.exports = router;