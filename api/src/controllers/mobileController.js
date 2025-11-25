const { Location } = require('../models');
const ResponseHelper = require('../utils/responseHelper');

class MobileController {
  /**
   * Get all districts with filters
   * GET /api/mobile/districts
   */
  async getDistricts(req, res) {
    try {
      const {
        search = '',
        isActive = true,
        page = 1,
        limit = 1000, // Default to large limit for mobile (full list)
        sort = 'name',
        order = 'asc'
      } = req.query;

      // Build query
      const query = {
        type: 'district'
      };

      // Handle isActive filter
      if (isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true' || isActive === true;
      }

      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'desc' ? -1 : 1;

      // Fetch districts
      const districts = await Location.find(query)
        .select('name code type isActive coordinates contactPerson')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Location.countDocuments(query);

      return ResponseHelper.success(res, {
        districts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }, 'Districts retrieved successfully');

    } catch (error) {
      console.error('❌ Get Districts Error:', error);
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get all areas with filters
   * GET /api/mobile/areas
   */
  async getAreas(req, res) {
    try {
      const {
        district = '',
        search = '',
        isActive = true,
        page = 1,
        limit = 1000, // Default to large limit for mobile (full list)
        sort = 'name',
        order = 'asc'
      } = req.query;

      // Build query
      const query = {
        type: 'area'
      };

      // Handle isActive filter
      if (isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true' || isActive === true;
      }

      // Filter by district if provided
      if (district) {
        query.parent = district;
      }

      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'desc' ? -1 : 1;

      // Fetch areas
      const areas = await Location.find(query)
        .populate('parent', 'name code type')
        .select('name code type parent isActive coordinates contactPerson')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Location.countDocuments(query);

      return ResponseHelper.success(res, {
        areas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }, 'Areas retrieved successfully');

    } catch (error) {
      console.error('❌ Get Areas Error:', error);
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  /**
   * Get all units with filters
   * GET /api/mobile/units
   */
  async getUnits(req, res) {
    try {
      const {
        district = '',
        area = '',
        search = '',
        isActive = true,
        page = 1,
        limit = 1000, // Default to large limit for mobile (full list)
        sort = 'name',
        order = 'asc'
      } = req.query;

      // Build query
      const query = {
        type: 'unit'
      };

      // Handle isActive filter
      if (isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true' || isActive === true;
      }

      // Filter by area if provided (priority)
      if (area) {
        query.parent = area;
      } else if (district) {
        // If district is provided but not area, find all areas in district first
        const areasInDistrict = await Location.find({
          type: 'area',
          parent: district,
          isActive: true
        }).select('_id');

        const areaIds = areasInDistrict.map(a => a._id);
        query.parent = { $in: areaIds };
      }

      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'desc' ? -1 : 1;

      // Fetch units
      const units = await Location.find(query)
        .populate('parent', 'name code type')
        .select('name code type parent isActive coordinates contactPerson')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Location.countDocuments(query);

      return ResponseHelper.success(res, {
        units,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }, 'Units retrieved successfully');

    } catch (error) {
      console.error('❌ Get Units Error:', error);
      return ResponseHelper.error(res, error.message, 500);
    }
  }
}

module.exports = new MobileController();

