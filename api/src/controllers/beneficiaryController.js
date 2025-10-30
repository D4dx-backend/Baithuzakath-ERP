const Beneficiary = require('../models/Beneficiary');
const Location = require('../models/Location');
const { validationResult } = require('express-validator');

// Get all beneficiaries with pagination and search
const getBeneficiaries = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      state = '', 
      district = '', 
      area = '', 
      unit = '' 
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (state) filter.state = state;
    if (district) filter.district = district;
    if (area) filter.area = area;
    if (unit) filter.unit = unit;

    // Apply user's regional access restrictions
    const userRegionalFilter = getUserRegionalFilter(req.user);
    Object.assign(filter, userRegionalFilter);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const beneficiaries = await Beneficiary.find(filter)
      .populate('state', 'name code')
      .populate('district', 'name code')
      .populate('area', 'name code')
      .populate('unit', 'name code')
      .populate('createdBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Beneficiary.countDocuments(filter);

    res.json({
      beneficiaries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching beneficiaries:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single beneficiary
const getBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id)
      .populate('state', 'name code')
      .populate('district', 'name code')
      .populate('area', 'name code')
      .populate('unit', 'name code')
      .populate('createdBy', 'name')
      .populate('verifiedBy', 'name')
      .populate('applications');

    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }

    // Check if user has access to this beneficiary
    if (!hasAccessToBeneficiary(req.user, beneficiary)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(beneficiary);
  } catch (error) {
    console.error('Error fetching beneficiary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new beneficiary
const createBeneficiary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, state, district, area, unit } = req.body;

    // Check if phone already exists
    const existingBeneficiary = await Beneficiary.findOne({ phone });
    if (existingBeneficiary) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    // Verify location hierarchy
    const locationValid = await verifyLocationHierarchy(state, district, area, unit);
    if (!locationValid) {
      return res.status(400).json({ message: 'Invalid location hierarchy' });
    }

    // Check if user has access to create beneficiary in this location
    if (!hasAccessToLocation(req.user, { state, district, area, unit })) {
      return res.status(403).json({ message: 'Access denied for this location' });
    }

    const beneficiary = new Beneficiary({
      name,
      phone,
      state,
      district,
      area,
      unit,
      createdBy: req.user.id
    });

    await beneficiary.save();

    const populatedBeneficiary = await Beneficiary.findById(beneficiary._id)
      .populate('state', 'name code')
      .populate('district', 'name code')
      .populate('area', 'name code')
      .populate('unit', 'name code')
      .populate('createdBy', 'name');

    res.status(201).json(populatedBeneficiary);
  } catch (error) {
    console.error('Error creating beneficiary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update beneficiary
const updateBeneficiary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const beneficiary = await Beneficiary.findById(req.params.id);
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }

    // Check if user has access to update this beneficiary
    if (!hasAccessToBeneficiary(req.user, beneficiary)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, phone, state, district, area, unit, status } = req.body;

    // Check if phone already exists (excluding current beneficiary)
    if (phone && phone !== beneficiary.phone) {
      const existingBeneficiary = await Beneficiary.findOne({ 
        phone, 
        _id: { $ne: req.params.id } 
      });
      if (existingBeneficiary) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }
    }

    // Verify location hierarchy if location is being updated
    if (state || district || area || unit) {
      const newState = state || beneficiary.state;
      const newDistrict = district || beneficiary.district;
      const newArea = area || beneficiary.area;
      const newUnit = unit || beneficiary.unit;
      
      const locationValid = await verifyLocationHierarchy(newState, newDistrict, newArea, newUnit);
      if (!locationValid) {
        return res.status(400).json({ message: 'Invalid location hierarchy' });
      }

      // Check if user has access to new location
      if (!hasAccessToLocation(req.user, { 
        state: newState, 
        district: newDistrict, 
        area: newArea, 
        unit: newUnit 
      })) {
        return res.status(403).json({ message: 'Access denied for this location' });
      }
    }

    // Update fields
    if (name) beneficiary.name = name;
    if (phone) beneficiary.phone = phone;
    if (state) beneficiary.state = state;
    if (district) beneficiary.district = district;
    if (area) beneficiary.area = area;
    if (unit) beneficiary.unit = unit;
    if (status) beneficiary.status = status;
    
    beneficiary.updatedBy = req.user.id;

    await beneficiary.save();

    const updatedBeneficiary = await Beneficiary.findById(beneficiary._id)
      .populate('state', 'name code')
      .populate('district', 'name code')
      .populate('area', 'name code')
      .populate('unit', 'name code')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    res.json(updatedBeneficiary);
  } catch (error) {
    console.error('Error updating beneficiary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete beneficiary
const deleteBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }

    // Check if user has access to delete this beneficiary
    if (!hasAccessToBeneficiary(req.user, beneficiary)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if beneficiary has applications
    if (beneficiary.applications && beneficiary.applications.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete beneficiary with existing applications' 
      });
    }

    await Beneficiary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Beneficiary deleted successfully' });
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify beneficiary
const verifyBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }

    // Check if user has access to verify this beneficiary
    if (!hasAccessToBeneficiary(req.user, beneficiary)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    beneficiary.isVerified = true;
    beneficiary.verifiedBy = req.user.id;
    beneficiary.verifiedAt = new Date();
    beneficiary.status = 'active';
    beneficiary.updatedBy = req.user.id;

    await beneficiary.save();

    const verifiedBeneficiary = await Beneficiary.findById(beneficiary._id)
      .populate('state', 'name code')
      .populate('district', 'name code')
      .populate('area', 'name code')
      .populate('unit', 'name code')
      .populate('verifiedBy', 'name');

    res.json(verifiedBeneficiary);
  } catch (error) {
    console.error('Error verifying beneficiary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper functions
const getUserRegionalFilter = (user) => {
  const filter = {};
  
  if (user.role === 'state_admin' && user.regionalAccess?.state) {
    filter.state = user.regionalAccess.state;
  } else if (user.role === 'district_admin' && user.regionalAccess?.district) {
    filter.district = user.regionalAccess.district;
  } else if (user.role === 'area_admin' && user.regionalAccess?.area) {
    filter.area = user.regionalAccess.area;
  } else if (user.role === 'unit_admin' && user.regionalAccess?.unit) {
    filter.unit = user.regionalAccess.unit;
  }
  
  return filter;
};

const hasAccessToBeneficiary = (user, beneficiary) => {
  if (user.role === 'super_admin') return true;
  
  if (user.role === 'state_admin') {
    return user.regionalAccess?.state?.toString() === beneficiary.state?.toString();
  } else if (user.role === 'district_admin') {
    return user.regionalAccess?.district?.toString() === beneficiary.district?.toString();
  } else if (user.role === 'area_admin') {
    return user.regionalAccess?.area?.toString() === beneficiary.area?.toString();
  } else if (user.role === 'unit_admin') {
    return user.regionalAccess?.unit?.toString() === beneficiary.unit?.toString();
  }
  
  return false;
};

const hasAccessToLocation = (user, location) => {
  if (user.role === 'super_admin') return true;
  
  if (user.role === 'state_admin') {
    return user.regionalAccess?.state?.toString() === location.state?.toString();
  } else if (user.role === 'district_admin') {
    return user.regionalAccess?.district?.toString() === location.district?.toString();
  } else if (user.role === 'area_admin') {
    return user.regionalAccess?.area?.toString() === location.area?.toString();
  } else if (user.role === 'unit_admin') {
    return user.regionalAccess?.unit?.toString() === location.unit?.toString();
  }
  
  return false;
};

const verifyLocationHierarchy = async (stateId, districtId, areaId, unitId) => {
  try {
    const [state, district, area, unit] = await Promise.all([
      Location.findById(stateId),
      Location.findById(districtId),
      Location.findById(areaId),
      Location.findById(unitId)
    ]);

    if (!state || !district || !area || !unit) return false;
    if (state.type !== 'state') return false;
    if (district.type !== 'district' || district.parent.toString() !== stateId.toString()) return false;
    if (area.type !== 'area' || area.parent.toString() !== districtId.toString()) return false;
    if (unit.type !== 'unit' || unit.parent.toString() !== areaId.toString()) return false;

    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  getBeneficiaries,
  getBeneficiary,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  verifyBeneficiary
};