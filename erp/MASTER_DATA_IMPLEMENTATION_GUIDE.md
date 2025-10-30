# 🏗️ Master Data Implementation Guide

## 📋 Overview

This guide provides a standardized approach for implementing master data modules in the Baithuzzakath Kerala NGO Management System. Based on the successful Projects implementation, this template ensures consistency across all modules.

## 🎯 Master Data Modules to Implement

### 1. **Schemes Management** 🎓
- Scheme creation and configuration
- Eligibility criteria management
- Application workflows
- Budget allocation

### 2. **User Management** 👥
- User creation and role assignment
- Regional access control
- Profile management
- Permission management

### 3. **Location Management** 📍
- Geographic hierarchy (State → District → Area → Unit)
- Location-based access control
- Administrative boundaries
- Population and area data

### 4. **Beneficiary Management** 🤝
- Beneficiary registration
- Document management
- Application history
- Status tracking

### 5. **Application Management** 📝
- Application workflows
- Approval processes
- Document verification
- Status updates

## 🏗️ Implementation Template

### Step 1: Backend Implementation

#### 1.1 Database Model
```javascript
// Example: src/models/Scheme.js
const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Scheme name is required'],
    trim: true,
    maxlength: [200, 'Scheme name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'Scheme code is required'],
    unique: true,
    uppercase: true,
    match: [/^[A-Z0-9_-]+$/, 'Invalid scheme code format']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Classification
  category: {
    type: String,
    enum: ['education', 'healthcare', 'housing', 'livelihood', 'emergency_relief'],
    required: [true, 'Category is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Financial Information
  budget: {
    total: { type: Number, required: true, min: 0 },
    allocated: { type: Number, default: 0, min: 0 },
    spent: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' }
  },
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['draft', 'active', 'suspended', 'closed'],
    default: 'draft'
  },
  
  // Relationships
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  targetRegions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  }],
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
schemeSchema.index({ code: 1 });
schemeSchema.index({ status: 1 });
schemeSchema.index({ project: 1 });
schemeSchema.index({ category: 1 });

// Virtual fields
schemeSchema.virtual('budgetUtilization').get(function() {
  return this.budget.total === 0 ? 0 : Math.round((this.budget.spent / this.budget.total) * 100);
});

// Methods
schemeSchema.methods.canUserAccess = function(user) {
  if (user.role === 'state_admin') return true;
  return this.targetRegions.some(regionId => 
    user.adminScope.regions.some(userRegionId => 
      userRegionId.toString() === regionId.toString()
    )
  );
};

module.exports = mongoose.model('Scheme', schemeSchema);
```

#### 1.2 Controller Implementation
```javascript
// Example: src/controllers/schemeController.js
const { Scheme, Project, Location } = require('../models');
const ResponseHelper = require('../utils/responseHelper');

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
        search
      } = req.query;

      // Build filter query
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (project) filter.project = project;
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Apply regional access control
      if (req.user.role !== 'state_admin') {
        const userRegions = req.user.adminScope.regions;
        filter.targetRegions = { $in: userRegions };
      }

      const skip = (page - 1) * limit;
      
      const schemes = await Scheme.find(filter)
        .populate('project', 'name code')
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
        .populate('project', 'name code description')
        .populate('targetRegions', 'name type code parent')
        .populate('createdBy', 'name email')
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

      // Validate target regions exist
      if (schemeData.targetRegions && schemeData.targetRegions.length > 0) {
        const regions = await Location.find({ _id: { $in: schemeData.targetRegions } });
        if (regions.length !== schemeData.targetRegions.length) {
          return ResponseHelper.error(res, 'One or more invalid target regions specified', 400);
        }
      }

      const scheme = new Scheme(schemeData);
      await scheme.save();

      const populatedScheme = await Scheme.findById(scheme._id)
        .populate('project', 'name code')
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

      Object.assign(scheme, updateData);
      await scheme.save();

      const populatedScheme = await Scheme.findById(scheme._id)
        .populate('project', 'name code')
        .populate('targetRegions', 'name type code')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      return ResponseHelper.success(res, { scheme: populatedScheme }, 'Scheme updated successfully');
    } catch (error) {
      console.error('❌ Update Scheme Error:', error);
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
      if (req.user.role !== 'state_admin') {
        const userRegions = req.user.adminScope.regions;
        filter.targetRegions = { $in: userRegions };
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
            }
          }
        }
      ]);

      const categoryStats = await Scheme.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget.total' }
          }
        }
      ]);

      return ResponseHelper.success(res, {
        overview: stats[0] || {
          totalSchemes: 0,
          totalBudget: 0,
          totalAllocated: 0,
          totalSpent: 0,
          activeSchemes: 0
        },
        byCategory: categoryStats
      });
    } catch (error) {
      console.error('❌ Get Scheme Stats Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch scheme statistics', 500);
    }
  }
}

module.exports = new SchemeController();
```

#### 1.3 Routes Implementation
```javascript
// Example: src/routes/schemeRoutes.js
const express = require('express');
const schemeController = require('../controllers/schemeController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/schemes/stats:
 *   get:
 *     summary: Get scheme statistics
 *     tags: [Schemes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', schemeController.getSchemeStats);

/**
 * @swagger
 * /api/schemes:
 *   get:
 *     summary: Get all schemes with filtering and pagination
 *     tags: [Schemes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', schemeController.getSchemes);

/**
 * @swagger
 * /api/schemes:
 *   post:
 *     summary: Create new scheme
 *     tags: [Schemes]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', 
  authorize('state_admin', 'district_admin', 'project_coordinator'),
  schemeController.createScheme
);

/**
 * @swagger
 * /api/schemes/{id}:
 *   get:
 *     summary: Get scheme by ID
 *     tags: [Schemes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', schemeController.getSchemeById);

/**
 * @swagger
 * /api/schemes/{id}:
 *   put:
 *     summary: Update scheme
 *     tags: [Schemes]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', 
  authorize('state_admin', 'district_admin', 'project_coordinator'),
  schemeController.updateScheme
);

/**
 * @swagger
 * /api/schemes/{id}:
 *   delete:
 *     summary: Delete scheme
 *     tags: [Schemes]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', 
  authorize('state_admin', 'district_admin'),
  schemeController.deleteScheme
);

module.exports = router;
```

#### 1.4 Add Routes to Main App
```javascript
// In src/app.js
const schemeRoutes = require('./routes/schemeRoutes');
app.use('/api/schemes', schemeRoutes);
```

### Step 2: Frontend Implementation

#### 2.1 API Client Extension
```typescript
// In src/lib/api.ts
export interface Scheme {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  budget: {
    total: number;
    allocated: number;
    spent: number;
    currency: string;
  };
  project: {
    id: string;
    name: string;
    code: string;
  };
  targetRegions: Array<{
    id: string;
    name: string;
    type: string;
    code: string;
  }>;
  budgetUtilization: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Add to ApiClient class
async getSchemes(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  project?: string;
  search?: string;
}): Promise<ApiResponse<{
  schemes: Scheme[];
  pagination: PaginationInfo;
}>> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const endpoint = `/schemes${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return this.request(endpoint);
}

async getScheme(id: string): Promise<ApiResponse<{ scheme: Scheme }>> {
  return this.request(`/schemes/${id}`);
}

async createScheme(schemeData: Partial<Scheme>): Promise<ApiResponse<{ scheme: Scheme }>> {
  return this.request('/schemes', {
    method: 'POST',
    body: JSON.stringify(schemeData),
  });
}

async updateScheme(id: string, schemeData: Partial<Scheme>): Promise<ApiResponse<{ scheme: Scheme }>> {
  return this.request(`/schemes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(schemeData),
  });
}

async deleteScheme(id: string): Promise<ApiResponse<null>> {
  return this.request(`/schemes/${id}`, {
    method: 'DELETE',
  });
}

async getSchemeStats(): Promise<ApiResponse<SchemeStats>> {
  return this.request('/schemes/stats');
}

// Export convenience methods
export const schemes = {
  getAll: (params?: any) => apiClient.getSchemes(params),
  getById: (id: string) => apiClient.getScheme(id),
  create: (data: Partial<Scheme>) => apiClient.createScheme(data),
  update: (id: string, data: Partial<Scheme>) => apiClient.updateScheme(id, data),
  delete: (id: string) => apiClient.deleteScheme(id),
  getStats: () => apiClient.getSchemeStats(),
};
```

#### 2.2 React Page Component
```typescript
// Example: src/pages/Schemes.tsx
import { useState, useEffect } from "react";
import { Plus, Calendar, DollarSign, Target, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchemeModal } from "@/components/modals/SchemeModal";
import { SchemeDetailsModal } from "@/components/modals/SchemeDetailsModal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { schemes as schemesApi, type Scheme } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function Schemes() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [schemeList, setSchemeList] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load schemes on component mount
  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await schemesApi.getAll();
      
      if (response.success && response.data) {
        setSchemeList(response.data.schemes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load schemes');
      toast({
        title: "Error",
        description: "Failed to load schemes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setShowDetailsModal(true);
  };

  const handleEdit = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setShowEditModal(true);
  };

  const handleDeleteClick = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedScheme) {
      try {
        await schemesApi.delete(selectedScheme.id);
        setSchemeList(schemeList.filter(s => s.id !== selectedScheme.id));
        setSelectedScheme(null);
        toast({
          title: "Success",
          description: "Scheme deleted successfully",
        });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to delete scheme",
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setSelectedScheme(null);
    loadSchemes(); // Reload schemes after save
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      <SchemeModal 
        open={showCreateModal} 
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) handleSave();
        }}
        mode="create"
      />
      <SchemeModal 
        open={showEditModal} 
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) handleSave();
        }}
        scheme={selectedScheme}
        mode="edit"
      />
      <SchemeDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        scheme={selectedScheme}
      />
      <DeleteConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Scheme"
        description="This will permanently delete this scheme and all associated data. This action cannot be undone."
        itemName={selectedScheme?.name}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schemes</h1>
          <p className="text-muted-foreground mt-1">Manage and track all schemes</p>
        </div>
        <Button className="bg-gradient-primary shadow-glow" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Scheme
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading schemes...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : schemeList.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent>
            <p className="text-muted-foreground">No schemes found. Create your first scheme to get started.</p>
            <Button 
              className="mt-4 bg-gradient-primary shadow-glow" 
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Scheme
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {schemeList.map((scheme) => (
            <Card key={scheme.id} className="overflow-hidden hover:shadow-elegant transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{scheme.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{scheme.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {scheme.code}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {scheme.category.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {scheme.priority}
                      </Badge>
                    </div>
                  </div>
                  <Badge className={`${
                    scheme.status === 'active' ? 'bg-green-100 text-green-800' :
                    scheme.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    scheme.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {scheme.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="text-sm font-medium">₹{(scheme.budget.total / 100000).toFixed(1)}L</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Project</p>
                      <p className="text-sm font-medium">{scheme.project.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{new Date(scheme.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget Utilization</span>
                    <span className="font-medium">{scheme.budgetUtilization}%</span>
                  </div>
                  <Progress value={scheme.budgetUtilization} className="h-2" />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(scheme)}>
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(scheme)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteClick(scheme)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 3: Seed Data Implementation

#### 3.1 Add to Seed Data Utility
```javascript
// In src/utils/seedData.js
static async seedSchemes() {
  try {
    console.log('🌱 Seeding scheme data...');

    // Check if schemes already exist
    const existingSchemes = await Scheme.countDocuments();
    if (existingSchemes > 0) {
      console.log('📊 Schemes already exist, skipping seed');
      return;
    }

    // Get required data
    const stateAdmin = await User.findOne({ email: 'admin@baithuzzakath.org' });
    const educationProject = await Project.findOne({ code: 'KESP-2025' });
    const kerala = await Location.findOne({ name: 'Kerala', type: 'state' });

    if (!stateAdmin || !educationProject || !kerala) {
      throw new Error('Required data not found. Please seed projects and locations first.');
    }

    // Create sample schemes
    const schemes = [
      {
        name: 'Student Scholarship Program',
        code: 'SSP-2025',
        description: 'Merit-based scholarships for underprivileged students pursuing higher education',
        category: 'education',
        priority: 'high',
        status: 'active',
        budget: {
          total: 2000000,
          allocated: 800000,
          spent: 300000
        },
        project: educationProject._id,
        targetRegions: [kerala._id],
        createdBy: stateAdmin._id
      },
      {
        name: 'Medical Emergency Fund',
        code: 'MEF-2025',
        description: 'Emergency medical assistance for critical health conditions',
        category: 'healthcare',
        priority: 'critical',
        status: 'active',
        budget: {
          total: 1500000,
          allocated: 600000,
          spent: 200000
        },
        project: educationProject._id,
        targetRegions: [kerala._id],
        createdBy: stateAdmin._id
      }
    ];

    // Insert schemes
    for (const schemeData of schemes) {
      const scheme = new Scheme(schemeData);
      await scheme.save();
    }

    console.log('✅ Scheme data seeded successfully');
    console.log(`📊 Created ${schemes.length} sample schemes`);
  } catch (error) {
    console.error('❌ Error seeding schemes:', error);
    throw error;
  }
}
```

#### 3.2 Update Seed Scripts
```javascript
// In scripts/seed.js - add to switch statement
case 'schemes':
  await SeedData.seedSchemes();
  break;

// In package.json - add script
"seed:schemes": "node scripts/seed.js schemes"
```

## 🔄 Implementation Checklist

### For Each Master Data Module:

#### Backend ✅
- [ ] Create Mongoose model with proper schema
- [ ] Implement controller with CRUD operations
- [ ] Create routes with proper authorization
- [ ] Add routes to main app.js
- [ ] Create seed data
- [ ] Test API endpoints

#### Frontend ✅
- [ ] Add TypeScript interfaces
- [ ] Extend API client
- [ ] Create React page component
- [ ] Create modal components (Create/Edit/Details)
- [ ] Add navigation routes
- [ ] Test UI functionality

#### Testing ✅
- [ ] Test API endpoints with Postman/curl
- [ ] Test frontend functionality
- [ ] Verify permissions and authorization
- [ ] Test data validation
- [ ] Test error handling

## 🎯 Module-Specific Considerations

### Schemes Module
- **Eligibility Criteria**: Complex rules engine
- **Application Workflow**: Multi-step approval process
- **Document Requirements**: File upload and verification
- **Beneficiary Limits**: Per-scheme application limits

### User Management Module
- **Role Hierarchy**: State → District → Area → Unit
- **Regional Access**: Geographic scope restrictions
- **Permission Matrix**: Feature-based permissions
- **Profile Management**: Extended user information

### Location Management Module
- **Hierarchical Structure**: Parent-child relationships
- **Geographic Data**: Coordinates, boundaries
- **Population Data**: Demographics and statistics
- **Administrative Mapping**: Government structure alignment

### Beneficiary Management Module
- **Identity Verification**: Aadhaar, documents
- **Family Information**: Household data
- **Income Assessment**: Financial eligibility
- **Application History**: Track all applications

### Application Management Module
- **Workflow Engine**: Configurable approval steps
- **Document Management**: File attachments
- **Status Tracking**: Real-time updates
- **Notification System**: SMS/Email alerts

## 🚀 Implementation Priority

### Phase 1: Core Master Data
1. **Schemes Management** (High Priority)
2. **User Management** (High Priority)
3. **Location Management** (Medium Priority)

### Phase 2: Operational Data
4. **Beneficiary Management** (High Priority)
5. **Application Management** (High Priority)

### Phase 3: Advanced Features
6. **Document Management**
7. **Notification Management**
8. **Reporting & Analytics**

## 📋 Success Criteria

### Each module should have:
- ✅ **Complete CRUD Operations**
- ✅ **Proper Authorization & Permissions**
- ✅ **Data Validation & Error Handling**
- ✅ **Responsive UI Components**
- ✅ **Real-time Data Integration**
- ✅ **Comprehensive Testing**

This template ensures consistency, maintainability, and scalability across all master data modules in the Baithuzzakath Kerala NGO Management System.