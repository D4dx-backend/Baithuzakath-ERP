const { Project, Scheme, Application, Payment } = require('../models');
const ResponseHelper = require('../utils/responseHelper');

class BudgetController {
  /**
   * Get budget overview and statistics
   * GET /api/budget/overview
   */
  async getBudgetOverview(req, res) {
    try {
      // Get project budget data
      const projectStats = await Project.aggregate([
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$budget.total' },
            totalAllocated: { $sum: '$budget.allocated' },
            totalSpent: { $sum: '$budget.spent' },
            projectCount: { $sum: 1 }
          }
        }
      ]);

      // Get scheme budget data
      const schemeStats = await Scheme.aggregate([
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$budget.total' },
            totalAllocated: { $sum: '$budget.allocated' },
            totalSpent: { $sum: '$budget.spent' },
            schemeCount: { $sum: 1 }
          }
        }
      ]);

      // Get payment data for actual disbursements
      const paymentStats = await Payment.aggregate([
        {
          $match: { status: 'completed' }
        },
        {
          $group: {
            _id: null,
            totalDisbursed: { $sum: '$amount' },
            paymentCount: { $sum: 1 }
          }
        }
      ]);

      const projectData = projectStats[0] || { totalBudget: 0, totalAllocated: 0, totalSpent: 0, projectCount: 0 };
      const schemeData = schemeStats[0] || { totalBudget: 0, totalAllocated: 0, totalSpent: 0, schemeCount: 0 };
      const paymentData = paymentStats[0] || { totalDisbursed: 0, paymentCount: 0 };

      const overview = {
        totalBudget: projectData.totalBudget + schemeData.totalBudget,
        totalAllocated: projectData.totalAllocated + schemeData.totalAllocated,
        totalSpent: projectData.totalSpent + schemeData.totalSpent,
        totalDisbursed: paymentData.totalDisbursed,
        availableBalance: (projectData.totalBudget + schemeData.totalBudget) - (projectData.totalSpent + schemeData.totalSpent),
        utilizationRate: ((projectData.totalSpent + schemeData.totalSpent) / (projectData.totalBudget + schemeData.totalBudget)) * 100 || 0
      };

      return ResponseHelper.success(res, { overview });
    } catch (error) {
      console.error('❌ Get Budget Overview Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch budget overview', 500);
    }
  }

  /**
   * Get budget breakdown by projects
   * GET /api/budget/projects
   */
  async getProjectBudgets(req, res) {
    try {
      const projects = await Project.find({ status: { $ne: 'cancelled' } })
        .select('name code budget status category')
        .sort({ 'budget.total': -1 });

      const projectBudgets = projects.map(project => ({
        id: project._id,
        name: project.name,
        code: project.code,
        category: project.category,
        status: project.status,
        allocated: project.budget.total,
        spent: project.budget.spent,
        available: project.budget.total - project.budget.spent,
        utilizationRate: project.budget.total > 0 ? (project.budget.spent / project.budget.total) * 100 : 0
      }));

      return ResponseHelper.success(res, { projects: projectBudgets });
    } catch (error) {
      console.error('❌ Get Project Budgets Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch project budgets', 500);
    }
  }

  /**
   * Get budget breakdown by schemes
   * GET /api/budget/schemes
   */
  async getSchemeBudgets(req, res) {
    try {
      const schemes = await Scheme.find({ status: { $ne: 'cancelled' } })
        .populate('project', 'name code')
        .select('name code budget status category project')
        .sort({ 'budget.total': -1 });

      const schemeBudgets = schemes.map(scheme => ({
        id: scheme._id,
        name: scheme.name,
        code: scheme.code,
        category: scheme.category,
        status: scheme.status,
        project: scheme.project,
        allocated: scheme.budget.total,
        spent: scheme.budget.spent,
        available: scheme.budget.total - scheme.budget.spent,
        utilizationRate: scheme.budget.total > 0 ? (scheme.budget.spent / scheme.budget.total) * 100 : 0
      }));

      return ResponseHelper.success(res, { schemes: schemeBudgets });
    } catch (error) {
      console.error('❌ Get Scheme Budgets Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch scheme budgets', 500);
    }
  }

  /**
   * Get recent transactions
   * GET /api/budget/transactions
   */
  async getRecentTransactions(req, res) {
    try {
      const { limit = 10 } = req.query;

      const transactions = await Payment.find()
        .populate('application', 'applicationNumber')
        .populate('beneficiary', 'name phone')
        .populate('scheme', 'name')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      const formattedTransactions = transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type || 'disbursement',
        amount: transaction.amount,
        description: `Payment to ${transaction.beneficiary?.name || 'Beneficiary'} for ${transaction.scheme?.name || 'Scheme'}`,
        date: transaction.createdAt,
        status: transaction.status,
        applicationNumber: transaction.application?.applicationNumber,
        beneficiaryName: transaction.beneficiary?.name,
        schemeName: transaction.scheme?.name,
        projectName: transaction.project?.name
      }));

      return ResponseHelper.success(res, { transactions: formattedTransactions });
    } catch (error) {
      console.error('❌ Get Recent Transactions Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch recent transactions', 500);
    }
  }

  /**
   * Get monthly budget summary
   * GET /api/budget/monthly-summary
   */
  async getMonthlySummary(req, res) {
    try {
      const { year = new Date().getFullYear(), months = 6 } = req.query;

      const startDate = new Date(year, new Date().getMonth() - months + 1, 1);
      const endDate = new Date(year, new Date().getMonth() + 1, 0);

      const monthlyData = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
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
            transactionCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      const summary = monthlyData.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        amount: item.totalAmount,
        transactions: item.transactionCount
      }));

      return ResponseHelper.success(res, { summary });
    } catch (error) {
      console.error('❌ Get Monthly Summary Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch monthly summary', 500);
    }
  }

  /**
   * Get budget by category
   * GET /api/budget/by-category
   */
  async getBudgetByCategory(req, res) {
    try {
      const categoryData = await Project.aggregate([
        {
          $group: {
            _id: '$category',
            totalBudget: { $sum: '$budget.total' },
            totalSpent: { $sum: '$budget.spent' },
            projectCount: { $sum: 1 }
          }
        },
        {
          $sort: { totalBudget: -1 }
        }
      ]);

      const categories = categoryData.map(item => ({
        category: item._id,
        totalBudget: item.totalBudget,
        totalSpent: item.totalSpent,
        available: item.totalBudget - item.totalSpent,
        utilizationRate: item.totalBudget > 0 ? (item.totalSpent / item.totalBudget) * 100 : 0,
        projectCount: item.projectCount
      }));

      return ResponseHelper.success(res, { categories });
    } catch (error) {
      console.error('❌ Get Budget By Category Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch budget by category', 500);
    }
  }
}

module.exports = new BudgetController();