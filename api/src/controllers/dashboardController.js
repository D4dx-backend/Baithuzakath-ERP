const { Project, Scheme, Application, Payment, User, Beneficiary } = require('../models');
const ResponseHelper = require('../utils/responseHelper');

class DashboardController {
  /**
   * Get dashboard overview statistics
   * GET /api/dashboard/overview
   */
  async getOverview(req, res) {
    try {
      // Get counts for main entities
      const [
        totalProjects,
        totalSchemes,
        totalApplications,
        totalBeneficiaries,
        totalUsers
      ] = await Promise.all([
        Project.countDocuments(),
        Scheme.countDocuments(),
        Application.countDocuments(),
        Beneficiary.countDocuments(),
        User.countDocuments()
      ]);

      // Get application status breakdown
      const applicationStats = await Application.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get total budget and spending
      const budgetStats = await Project.aggregate([
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$budget.total' },
            totalSpent: { $sum: '$budget.spent' }
          }
        }
      ]);

      // Get recent activity counts
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [
        recentApplications,
        recentPayments,
        recentBeneficiaries
      ] = await Promise.all([
        Application.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Payment.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Beneficiary.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
      ]);

      const budget = budgetStats[0] || { totalBudget: 0, totalSpent: 0 };
      const appStatusMap = applicationStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      const overview = {
        totalProjects,
        totalSchemes,
        totalApplications,
        totalBeneficiaries,
        totalUsers,
        totalBudget: budget.totalBudget,
        totalSpent: budget.totalSpent,
        availableBudget: budget.totalBudget - budget.totalSpent,
        applicationStats: {
          pending: appStatusMap.pending || 0,
          approved: appStatusMap.approved || 0,
          rejected: appStatusMap.rejected || 0,
          review: appStatusMap.review || 0
        },
        recentActivity: {
          applications: recentApplications,
          payments: recentPayments,
          beneficiaries: recentBeneficiaries
        }
      };

      return ResponseHelper.success(res, { overview });
    } catch (error) {
      console.error('❌ Get Dashboard Overview Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch dashboard overview', 500);
    }
  }

  /**
   * Get recent applications
   * GET /api/dashboard/recent-applications
   */
  async getRecentApplications(req, res) {
    try {
      const { limit = 10 } = req.query;

      const applications = await Application.find()
        .populate('beneficiary', 'name phone')
        .populate('scheme', 'name')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      const recentApplications = applications.map(app => ({
        id: app.applicationNumber,
        applicant: app.beneficiary?.name || 'Unknown',
        scheme: app.scheme?.name || 'Unknown Scheme',
        project: app.project?.name || 'Unknown Project',
        status: app.status,
        date: app.createdAt,
        amount: app.requestedAmount
      }));

      return ResponseHelper.success(res, { applications: recentApplications });
    } catch (error) {
      console.error('❌ Get Recent Applications Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch recent applications', 500);
    }
  }

  /**
   * Get recent payments
   * GET /api/dashboard/recent-payments
   */
  async getRecentPayments(req, res) {
    try {
      const { limit = 10 } = req.query;

      const payments = await Payment.find()
        .populate('beneficiary', 'name')
        .populate('scheme', 'name')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      const recentPayments = payments.map(payment => ({
        id: payment.paymentNumber,
        beneficiary: payment.beneficiary?.name || 'Unknown',
        scheme: payment.scheme?.name || 'Unknown Scheme',
        project: payment.project?.name || 'Unknown Project',
        amount: payment.amount,
        status: payment.status,
        date: payment.createdAt,
        method: payment.method
      }));

      return ResponseHelper.success(res, { payments: recentPayments });
    } catch (error) {
      console.error('❌ Get Recent Payments Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch recent payments', 500);
    }
  }

  /**
   * Get monthly trends
   * GET /api/dashboard/monthly-trends
   */
  async getMonthlyTrends(req, res) {
    try {
      const { months = 6 } = req.query;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get application trends
      const applicationTrends = await Application.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            applications: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      // Get payment trends
      const paymentTrends = await Payment.aggregate([
        {
          $match: { 
            createdAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalAmount: { $sum: '$amount' },
            paymentCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      const trends = {
        applications: applicationTrends.map(trend => ({
          month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
          applications: trend.applications,
          approved: trend.approved
        })),
        payments: paymentTrends.map(trend => ({
          month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
          amount: trend.totalAmount,
          count: trend.paymentCount
        }))
      };

      return ResponseHelper.success(res, { trends });
    } catch (error) {
      console.error('❌ Get Monthly Trends Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch monthly trends', 500);
    }
  }

  /**
   * Get project performance
   * GET /api/dashboard/project-performance
   */
  async getProjectPerformance(req, res) {
    try {
      const projects = await Project.find({ status: 'active' })
        .select('name budget statistics')
        .sort({ 'budget.total': -1 })
        .limit(10);

      const performance = projects.map(project => ({
        id: project._id,
        name: project.name,
        budget: project.budget.total,
        spent: project.budget.spent,
        utilization: project.budget.total > 0 ? (project.budget.spent / project.budget.total) * 100 : 0,
        beneficiaries: project.statistics?.totalBeneficiaries || 0,
        applications: project.statistics?.totalApplications || 0
      }));

      return ResponseHelper.success(res, { projects: performance });
    } catch (error) {
      console.error('❌ Get Project Performance Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch project performance', 500);
    }
  }
}

module.exports = new DashboardController();