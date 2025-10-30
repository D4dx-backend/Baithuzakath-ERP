const { Donor, Payment, User, Project, Scheme } = require('../models');
const ResponseHelper = require('../utils/responseHelper');
const mongoose = require('mongoose');

class DonorController {
  /**
   * Get all donors with pagination and filtering
   * GET /api/donors
   */
  async getDonors(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        type = '',
        category = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filter object
      const filter = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (category) filter.category = category;

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculate pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Get donors with pagination
      const [donors, total] = await Promise.all([
        Donor.find(filter)
          .populate('preferredPrograms', 'name code')
          .populate('preferredSchemes', 'name code')
          .populate('assignedTo', 'name email')
          .populate('createdBy', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Donor.countDocuments(filter)
      ]);

      const pagination = {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      };

      return ResponseHelper.success(res, {
        donors,
        pagination
      });
    } catch (error) {
      console.error('❌ Get Donors Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch donors', 500);
    }
  }

  /**
   * Get single donor by ID
   * GET /api/donors/:id
   */
  async getDonor(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ResponseHelper.error(res, 'Invalid donor ID', 400);
      }

      const donor = await Donor.findById(id)
        .populate('preferredPrograms', 'name code description')
        .populate('preferredSchemes', 'name code description')
        .populate('assignedTo', 'name email phone')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!donor) {
        return ResponseHelper.error(res, 'Donor not found', 404);
      }

      // Get donation history
      const donationHistory = await donor.getDonationHistory(20);

      return ResponseHelper.success(res, {
        donor,
        donationHistory
      });
    } catch (error) {
      console.error('❌ Get Donor Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch donor', 500);
    }
  }

  /**
   * Create new donor
   * POST /api/donors
   */
  async createDonor(req, res) {
    try {
      const donorData = {
        ...req.body,
        createdBy: req.user._id
      };

      // Check if donor with email already exists
      const existingDonor = await Donor.findOne({ email: donorData.email });
      if (existingDonor) {
        return ResponseHelper.error(res, 'Donor with this email already exists', 400);
      }

      const donor = new Donor(donorData);
      await donor.save();

      // Populate the created donor
      await donor.populate([
        { path: 'preferredPrograms', select: 'name code' },
        { path: 'preferredSchemes', select: 'name code' },
        { path: 'createdBy', select: 'name email' }
      ]);

      return ResponseHelper.success(res, { donor }, 'Donor created successfully', 201);
    } catch (error) {
      console.error('❌ Create Donor Error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return ResponseHelper.error(res, `Donor with this ${field} already exists`, 400);
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return ResponseHelper.error(res, messages.join(', '), 400);
      }
      
      return ResponseHelper.error(res, 'Failed to create donor', 500);
    }
  }

  /**
   * Update donor
   * PUT /api/donors/:id
   */
  async updateDonor(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ResponseHelper.error(res, 'Invalid donor ID', 400);
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user._id
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.donationStats;
      delete updateData.createdBy;
      delete updateData.createdAt;

      const donor = await Donor.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('preferredPrograms', 'name code')
        .populate('preferredSchemes', 'name code')
        .populate('assignedTo', 'name email')
        .populate('updatedBy', 'name email');

      if (!donor) {
        return ResponseHelper.error(res, 'Donor not found', 404);
      }

      return ResponseHelper.success(res, { donor }, 'Donor updated successfully');
    } catch (error) {
      console.error('❌ Update Donor Error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return ResponseHelper.error(res, `Donor with this ${field} already exists`, 400);
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return ResponseHelper.error(res, messages.join(', '), 400);
      }
      
      return ResponseHelper.error(res, 'Failed to update donor', 500);
    }
  }

  /**
   * Delete donor
   * DELETE /api/donors/:id
   */
  async deleteDonor(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ResponseHelper.error(res, 'Invalid donor ID', 400);
      }

      // Check if donor has any donations
      const donationCount = await Payment.countDocuments({
        donor: id,
        type: 'donation'
      });

      if (donationCount > 0) {
        return ResponseHelper.error(res, 'Cannot delete donor with existing donations. Consider deactivating instead.', 400);
      }

      const donor = await Donor.findByIdAndDelete(id);

      if (!donor) {
        return ResponseHelper.error(res, 'Donor not found', 404);
      }

      return ResponseHelper.success(res, null, 'Donor deleted successfully');
    } catch (error) {
      console.error('❌ Delete Donor Error:', error);
      return ResponseHelper.error(res, 'Failed to delete donor', 500);
    }
  }

  /**
   * Get donor statistics
   * GET /api/donors/stats
   */
  async getDonorStats(req, res) {
    try {
      // Get total donors
      const totalDonors = await Donor.countDocuments({ status: 'active' });
      const activeDonors = await Donor.countDocuments({ 
        status: 'active',
        'donationStats.lastDonation': { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
      });

      // Get this month's donations and new donors
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const [thisMonthStats, newDonorsThisMonth] = await Promise.all([
        Payment.aggregate([
          {
            $match: {
              type: 'donation',
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              donationCount: { $sum: 1 },
              uniqueDonors: { $addToSet: '$donor' }
            }
          }
        ]),
        Donor.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        })
      ]);

      // Get overall donation statistics
      const [overallStats] = await Payment.aggregate([
        {
          $match: { 
            type: 'donation',
            status: 'completed' 
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalDonations: { $sum: 1 },
            averageDonation: { $avg: '$amount' }
          }
        }
      ]);

      // Get recurring donors count (based on donor preferences)
      const recurringDonors = await Donor.countDocuments({
        'donationPreferences.frequency': { $ne: 'one-time' },
        status: 'active'
      });

      // Get patron donors count
      const patronDonors = await Donor.countDocuments({
        category: { $in: ['patron', 'major'] },
        status: 'active'
      });

      // Get donors by type
      const donorsByType = await Donor.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalDonated: { $sum: '$donationStats.totalDonated' }
          }
        },
        {
          $addFields: {
            percentage: {
              $multiply: [
                { $divide: ['$count', totalDonors] },
                100
              ]
            }
          }
        }
      ]);

      // Get donors by category
      const donorsByCategory = await Donor.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalDonated: { $sum: '$donationStats.totalDonated' }
          }
        },
        {
          $addFields: {
            percentage: {
              $multiply: [
                { $divide: ['$count', totalDonors] },
                100
              ]
            }
          }
        }
      ]);

      // Get donations by method
      const donationsByMethod = await Payment.aggregate([
        {
          $match: { 
            type: 'donation',
            status: 'completed' 
          }
        },
        {
          $group: {
            _id: '$method',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $addFields: {
            percentage: {
              $multiply: [
                { $divide: ['$count', overallStats?.totalDonations || 1] },
                100
              ]
            }
          }
        }
      ]);

      // Get monthly trends for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyTrends = await Payment.aggregate([
        {
          $match: {
            type: 'donation',
            status: 'completed',
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            donationAmount: { $sum: '$amount' },
            donorCount: { $addToSet: '$donor' },
            newDonors: { $sum: 1 } // This is simplified, would need more complex logic for actual new donors
          }
        },
        {
          $addFields: {
            month: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                { $toString: { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] } }
              ]
            },
            donorCount: { $size: '$donorCount' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      // Get top donors
      const topDonors = await Donor.find({ status: 'active' })
        .sort({ 'donationStats.totalDonated': -1 })
        .limit(5)
        .select('name donationStats.totalDonated donationStats.donationCount donationStats.lastDonation')
        .lean();

      const thisMonth = thisMonthStats[0] || { totalAmount: 0, donationCount: 0, uniqueDonors: [] };
      const overall = overallStats || { totalAmount: 0, totalDonations: 0, averageDonation: 0 };

      const stats = {
        overview: {
          totalDonors,
          activeDonors,
          newDonorsThisMonth,
          totalDonationsAmount: overall.totalAmount,
          totalDonationsCount: overall.totalDonations,
          averageDonation: overall.averageDonation,
          recurringDonors,
          patronDonors
        },
        byType: donorsByType.map(item => ({
          type: item._id,
          count: item.count,
          totalAmount: item.totalDonated,
          percentage: item.percentage
        })),
        byCategory: donorsByCategory.map(item => ({
          category: item._id,
          count: item.count,
          totalAmount: item.totalDonated,
          percentage: item.percentage
        })),
        byMethod: donationsByMethod.map(item => ({
          method: item._id,
          count: item.count,
          totalAmount: item.totalAmount,
          percentage: item.percentage
        })),
        monthlyTrends: monthlyTrends.map(trend => ({
          month: trend.month,
          donorCount: trend.donorCount,
          donationAmount: trend.donationAmount,
          newDonors: Math.floor(trend.newDonors * 0.1) // Simplified calculation
        })),
        topDonors: topDonors.map(donor => ({
          id: donor._id,
          name: donor.name,
          totalDonated: donor.donationStats.totalDonated,
          donationCount: donor.donationStats.donationCount,
          lastDonation: donor.donationStats.lastDonation
        })),
        recentDonations: [] // Will be populated by separate endpoint
      };

      return ResponseHelper.success(res, { data: stats });
    } catch (error) {
      console.error('❌ Get Donor Stats Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch donor statistics', 500);
    }
  }

  /**
   * Get top donors
   * GET /api/donors/top
   */
  async getTopDonors(req, res) {
    try {
      const { limit = 10 } = req.query;

      const topDonors = await Donor.find({ status: 'active' })
        .sort({ 'donationStats.totalDonated': -1 })
        .limit(parseInt(limit))
        .populate('preferredPrograms', 'name')
        .lean();

      return ResponseHelper.success(res, { donors: topDonors });
    } catch (error) {
      console.error('❌ Get Top Donors Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch top donors', 500);
    }
  }

  /**
   * Get recent donations
   * GET /api/donors/recent-donations
   */
  async getRecentDonations(req, res) {
    try {
      const { limit = 20 } = req.query;

      const recentDonations = await Payment.find({
        type: 'donation',
        status: 'completed'
      })
        .populate('donor', 'name email phone type category')
        .populate('project', 'name code')
        .populate('scheme', 'name code')
        .sort({ 'timeline.completedAt': -1 })
        .limit(parseInt(limit))
        .lean();

      const donations = recentDonations.map(donation => ({
        id: donation._id,
        paymentNumber: donation.paymentNumber,
        amount: donation.amount,
        donor: {
          id: donation.donor?._id,
          name: donation.donor?.name || 'Anonymous',
          email: donation.donor?.email,
          phone: donation.donor?.phone,
          type: donation.donor?.type,
          category: donation.donor?.category
        },
        project: donation.project?.name,
        scheme: donation.scheme?.name,
        method: donation.method || 'online',
        date: donation.createdAt,
        completedAt: donation.timeline?.completedAt,
        status: donation.status
      }));

      return ResponseHelper.success(res, { donations });
    } catch (error) {
      console.error('❌ Get Recent Donations Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch recent donations', 500);
    }
  }

  /**
   * Get donation trends
   * GET /api/donors/trends
   */
  async getDonationTrends(req, res) {
    try {
      const { months = 6 } = req.query;
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const trends = await Payment.aggregate([
        {
          $match: {
            type: 'donation',
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalAmount: { $sum: '$amount' },
            donationCount: { $sum: 1 },
            uniqueDonors: { $addToSet: '$donor' }
          }
        },
        {
          $addFields: {
            uniqueDonorCount: { $size: '$uniqueDonors' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      const formattedTrends = trends.map(trend => ({
        month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
        amount: trend.totalAmount,
        donations: trend.donationCount,
        donors: trend.uniqueDonorCount
      }));

      return ResponseHelper.success(res, { trends: formattedTrends });
    } catch (error) {
      console.error('❌ Get Donation Trends Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch donation trends', 500);
    }
  }

  /**
   * Get projects for dropdown
   * GET /api/donors/projects
   */
  async getProjectsForDropdown(req, res) {
    try {
      const projects = await Project.find({ status: 'active' })
        .select('name code description category')
        .sort({ name: 1 })
        .lean();

      return ResponseHelper.success(res, { projects });
    } catch (error) {
      console.error('❌ Get Projects Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch projects', 500);
    }
  }

  /**
   * Get schemes for dropdown
   * GET /api/donors/schemes
   */
  async getSchemesForDropdown(req, res) {
    try {
      const { projectId } = req.query;
      
      const filter = { status: 'active' };
      if (projectId) {
        filter.project = projectId;
      }

      const schemes = await Scheme.find(filter)
        .select('name code description project')
        .populate('project', 'name code')
        .sort({ name: 1 })
        .lean();

      return ResponseHelper.success(res, { schemes });
    } catch (error) {
      console.error('❌ Get Schemes Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch schemes', 500);
    }
  }

  /**
   * Update donor status
   * PATCH /api/donors/:id/status
   */
  async updateDonorStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ResponseHelper.error(res, 'Invalid donor ID', 400);
      }

      if (!['active', 'inactive', 'blocked', 'pending_verification'].includes(status)) {
        return ResponseHelper.error(res, 'Invalid status', 400);
      }

      const donor = await Donor.findByIdAndUpdate(
        id,
        { status, updatedBy: req.user._id },
        { new: true }
      ).populate('updatedBy', 'name email');

      if (!donor) {
        return ResponseHelper.error(res, 'Donor not found', 404);
      }

      return ResponseHelper.success(res, { donor }, 'Donor status updated successfully');
    } catch (error) {
      console.error('❌ Update Donor Status Error:', error);
      return ResponseHelper.error(res, 'Failed to update donor status', 500);
    }
  }

  /**
   * Verify donor
   * PATCH /api/donors/:id/verify
   */
  async verifyDonor(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ResponseHelper.error(res, 'Invalid donor ID', 400);
      }

      const donor = await Donor.findByIdAndUpdate(
        id,
        { 
          isVerified: true, 
          verificationDate: new Date(),
          status: 'active',
          updatedBy: req.user._id 
        },
        { new: true }
      ).populate('updatedBy', 'name email');

      if (!donor) {
        return ResponseHelper.error(res, 'Donor not found', 404);
      }

      return ResponseHelper.success(res, { donor }, 'Donor verified successfully');
    } catch (error) {
      console.error('❌ Verify Donor Error:', error);
      return ResponseHelper.error(res, 'Failed to verify donor', 500);
    }
  }
}

module.exports = new DonorController();