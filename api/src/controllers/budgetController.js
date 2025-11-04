const { Project, Scheme, Application, Payment } = require('../models');
const ResponseHelper = require('../utils/responseHelper');

class BudgetController {
  /**
   * Get budget overview and statistics
   * GET /api/budget/overview
   */
  async getBudgetOverview(req, res) {
    try {
      const { period } = req.query;
      
      // Build date filter based on period
      const dateFilter = BudgetController.buildDateFilter(period);
      
      // Get project budget data with active projects only
      const projectStats = await Project.aggregate([
        {
          $match: { 
            status: { $ne: 'cancelled' },
            ...dateFilter
          }
        },
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

      // Get scheme budget data with active schemes only
      const schemeStats = await Scheme.aggregate([
        {
          $match: { 
            status: { $ne: 'cancelled' },
            ...dateFilter
          }
        },
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

      // Get actual disbursement data from completed payments
      const paymentDateFilter = BudgetController.buildPaymentDateFilter(period);
      const disbursementStats = await Payment.aggregate([
        {
          $match: { 
            status: 'completed',
            type: { $in: ['full_payment', 'installment'] },
            ...paymentDateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalDisbursed: { $sum: '$amount' },
            paymentCount: { $sum: 1 }
          }
        }
      ]);

      // Get approved applications total amount
      const approvedApplicationsStats = await Application.aggregate([
        {
          $match: { 
            status: { $in: ['approved', 'disbursed', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            totalApprovedAmount: { $sum: '$approvedAmount' },
            applicationCount: { $sum: 1 }
          }
        }
      ]);

      // Get pending payments amount
      const pendingPaymentsStats = await Payment.aggregate([
        {
          $match: { 
            status: { $in: ['pending', 'approved', 'processing'] }
          }
        },
        {
          $group: {
            _id: null,
            totalPendingAmount: { $sum: '$amount' },
            pendingCount: { $sum: 1 }
          }
        }
      ]);

      const projectData = projectStats[0] || { totalBudget: 0, totalAllocated: 0, totalSpent: 0, projectCount: 0 };
      const schemeData = schemeStats[0] || { totalBudget: 0, totalAllocated: 0, totalSpent: 0, schemeCount: 0 };
      const disbursementData = disbursementStats[0] || { totalDisbursed: 0, paymentCount: 0 };
      const approvedData = approvedApplicationsStats[0] || { totalApprovedAmount: 0, applicationCount: 0 };
      const pendingData = pendingPaymentsStats[0] || { totalPendingAmount: 0, pendingCount: 0 };

      // Calculate combined totals
      const totalBudget = projectData.totalBudget + schemeData.totalBudget;
      const totalAllocated = approvedData.totalApprovedAmount; // Real allocated amount from approved applications
      const totalSpent = disbursementData.totalDisbursed; // Real spent amount from completed payments
      const totalPending = pendingData.totalPendingAmount; // Pending disbursements

      const overview = {
        totalBudget,
        totalAllocated,
        totalSpent,
        totalDisbursed: disbursementData.totalDisbursed,
        totalPending,
        availableBalance: totalBudget - totalSpent,
        committedAmount: totalAllocated, // Amount committed through approved applications
        utilizationRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        allocationRate: totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0,
        projectCount: projectData.projectCount,
        schemeCount: schemeData.schemeCount,
        approvedApplications: approvedData.applicationCount,
        completedPayments: disbursementData.paymentCount,
        pendingPayments: pendingData.pendingCount
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
      const { period } = req.query;
      const dateFilter = BudgetController.buildDateFilter(period);
      
      // Get projects with real financial data
      const projects = await Project.aggregate([
        {
          $match: { 
            status: { $ne: 'cancelled' },
            ...dateFilter
          }
        },
        {
          $lookup: {
            from: 'schemes',
            localField: '_id',
            foreignField: 'project',
            as: 'schemes'
          }
        },
        {
          $lookup: {
            from: 'applications',
            localField: '_id',
            foreignField: 'project',
            as: 'applications'
          }
        },
        {
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'project',
            as: 'payments'
          }
        },
        {
          $addFields: {
            // Calculate real allocated amount from approved applications
            realAllocated: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$applications',
                      cond: { $in: ['$$this.status', ['approved', 'disbursed', 'completed']] }
                    }
                  },
                  as: 'app',
                  in: '$$app.approvedAmount'
                }
              }
            },
            // Calculate real spent amount from completed payments
            realSpent: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$payments',
                      cond: { $eq: ['$$this.status', 'completed'] }
                    }
                  },
                  as: 'payment',
                  in: '$$payment.amount'
                }
              }
            },
            // Calculate pending payments
            pendingPayments: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$payments',
                      cond: { $in: ['$$this.status', ['pending', 'approved', 'processing']] }
                    }
                  },
                  as: 'payment',
                  in: '$$payment.amount'
                }
              }
            },
            schemesCount: { $size: '$schemes' },
            applicationsCount: { $size: '$applications' },
            paymentsCount: { $size: '$payments' }
          }
        },
        {
          $project: {
            name: 1,
            code: 1,
            category: 1,
            status: 1,
            budget: 1,
            realAllocated: 1,
            realSpent: 1,
            pendingPayments: 1,
            schemesCount: 1,
            applicationsCount: 1,
            paymentsCount: 1
          }
        },
        {
          $sort: { 'budget.total': -1 }
        }
      ]);

      const projectBudgets = projects.map(project => {
        const totalBudget = project.budget.total;
        const allocated = project.realAllocated || 0;
        const spent = project.realSpent || 0;
        const pending = project.pendingPayments || 0;
        
        return {
          id: project._id,
          name: project.name,
          code: project.code,
          category: project.category,
          status: project.status,
          totalBudget,
          allocated,
          spent,
          pending,
          available: totalBudget - spent,
          committedAmount: allocated + pending, // Total committed (approved + pending)
          utilizationRate: totalBudget > 0 ? (spent / totalBudget) * 100 : 0,
          allocationRate: totalBudget > 0 ? (allocated / totalBudget) * 100 : 0,
          schemesCount: project.schemesCount,
          applicationsCount: project.applicationsCount,
          paymentsCount: project.paymentsCount
        };
      });

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
      const { period } = req.query;
      const dateFilter = BudgetController.buildDateFilter(period);
      
      // Get schemes with real financial data
      const schemes = await Scheme.aggregate([
        {
          $match: { 
            status: { $ne: 'cancelled' },
            ...dateFilter
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'project',
            foreignField: '_id',
            as: 'projectInfo'
          }
        },
        {
          $lookup: {
            from: 'applications',
            localField: '_id',
            foreignField: 'scheme',
            as: 'applications'
          }
        },
        {
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'scheme',
            as: 'payments'
          }
        },
        {
          $addFields: {
            project: { $arrayElemAt: ['$projectInfo', 0] },
            // Calculate real allocated amount from approved applications
            realAllocated: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$applications',
                      cond: { $in: ['$$this.status', ['approved', 'disbursed', 'completed']] }
                    }
                  },
                  as: 'app',
                  in: '$$app.approvedAmount'
                }
              }
            },
            // Calculate real spent amount from completed payments
            realSpent: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$payments',
                      cond: { $eq: ['$$this.status', 'completed'] }
                    }
                  },
                  as: 'payment',
                  in: '$$payment.amount'
                }
              }
            },
            // Calculate pending payments
            pendingPayments: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$payments',
                      cond: { $in: ['$$this.status', ['pending', 'approved', 'processing']] }
                    }
                  },
                  as: 'payment',
                  in: '$$payment.amount'
                }
              }
            },
            // Application statistics
            totalApplications: { $size: '$applications' },
            approvedApplications: {
              $size: {
                $filter: {
                  input: '$applications',
                  cond: { $in: ['$$this.status', ['approved', 'disbursed', 'completed']] }
                }
              }
            },
            pendingApplications: {
              $size: {
                $filter: {
                  input: '$applications',
                  cond: { $in: ['$$this.status', ['pending', 'under_review', 'field_verification']] }
                }
              }
            }
          }
        },
        {
          $project: {
            name: 1,
            code: 1,
            category: 1,
            status: 1,
            budget: 1,
            project: { name: 1, code: 1, _id: 1 },
            realAllocated: 1,
            realSpent: 1,
            pendingPayments: 1,
            totalApplications: 1,
            approvedApplications: 1,
            pendingApplications: 1
          }
        },
        {
          $sort: { 'budget.total': -1 }
        }
      ]);

      const schemeBudgets = schemes.map(scheme => {
        const totalBudget = scheme.budget.total;
        const allocated = scheme.realAllocated || 0;
        const spent = scheme.realSpent || 0;
        const pending = scheme.pendingPayments || 0;
        
        return {
          id: scheme._id,
          name: scheme.name,
          code: scheme.code,
          category: scheme.category,
          status: scheme.status,
          project: scheme.project,
          totalBudget,
          allocated,
          spent,
          pending,
          available: totalBudget - spent,
          committedAmount: allocated + pending,
          utilizationRate: totalBudget > 0 ? (spent / totalBudget) * 100 : 0,
          allocationRate: totalBudget > 0 ? (allocated / totalBudget) * 100 : 0,
          totalApplications: scheme.totalApplications,
          approvedApplications: scheme.approvedApplications,
          pendingApplications: scheme.pendingApplications,
          successRate: scheme.totalApplications > 0 ? (scheme.approvedApplications / scheme.totalApplications) * 100 : 0
        };
      });

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
      const { limit = 10, status, type, project, scheme, period } = req.query;

      // Build filter query
      const filter = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (project) filter.project = project;
      if (scheme) filter.scheme = scheme;
      
      // Add period filter
      const paymentDateFilter = BudgetController.buildPaymentDateFilter(period);
      if (paymentDateFilter['timeline.completedAt']) {
        filter['timeline.completedAt'] = paymentDateFilter['timeline.completedAt'];
      }

      const transactions = await Payment.find(filter)
        .populate('application', 'applicationNumber')
        .populate('beneficiary', 'personalInfo.name contact.phone')
        .populate('scheme', 'name code')
        .populate('project', 'name code')
        .populate('initiatedBy', 'name')
        .populate('processedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      const formattedTransactions = transactions.map(transaction => {
        const beneficiaryName = transaction.beneficiary?.personalInfo?.name || 
                               transaction.beneficiary?.name || 'Unknown Beneficiary';
        const beneficiaryPhone = transaction.beneficiary?.contact?.phone || 
                                transaction.beneficiary?.phone || '';
        
        return {
          id: transaction._id,
          paymentNumber: transaction.paymentNumber,
          type: transaction.type,
          method: transaction.method,
          amount: transaction.amount,
          netAmount: transaction.financial?.netAmount || transaction.amount,
          description: `${transaction.type.replace('_', ' ').toUpperCase()} - ${beneficiaryName} (${transaction.scheme?.name || 'Unknown Scheme'})`,
          date: transaction.createdAt,
          status: transaction.status,
          applicationNumber: transaction.application?.applicationNumber,
          beneficiaryName,
          beneficiaryPhone,
          schemeName: transaction.scheme?.name,
          schemeCode: transaction.scheme?.code,
          projectName: transaction.project?.name,
          projectCode: transaction.project?.code,
          initiatedBy: transaction.initiatedBy?.name,
          processedBy: transaction.processedBy?.name,
          timeline: {
            initiated: transaction.timeline?.initiatedAt,
            approved: transaction.timeline?.approvedAt,
            processed: transaction.timeline?.processedAt,
            completed: transaction.timeline?.completedAt
          },
          processingDays: transaction.processingDays,
          // Include installment info if applicable
          installment: transaction.installment ? {
            number: transaction.installment.number,
            total: transaction.installment.totalInstallments,
            description: transaction.installment.description
          } : null,
          // Include verification status
          verification: {
            status: transaction.verification?.status || 'pending',
            verifiedBy: transaction.verification?.verifiedBy,
            verifiedAt: transaction.verification?.verifiedAt
          }
        };
      });

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
      const { year = new Date().getFullYear(), months = 12 } = req.query;

      // Calculate date range for the specified months
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - parseInt(months) + 1, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Get monthly payment data
      const monthlyPayments = await Payment.aggregate([
        {
          $match: {
            'timeline.completedAt': { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$timeline.completedAt' },
              month: { $month: '$timeline.completedAt' }
            },
            totalDisbursed: { $sum: '$amount' },
            paymentCount: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
            types: { $push: '$type' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      // Get monthly application approvals
      const monthlyApprovals = await Application.aggregate([
        {
          $match: {
            approvedAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['approved', 'disbursed', 'completed'] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$approvedAt' },
              month: { $month: '$approvedAt' }
            },
            totalApproved: { $sum: '$approvedAmount' },
            applicationCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      // Create a complete month range and merge data
      const summary = [];
      for (let i = 0; i < parseInt(months); i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const paymentData = monthlyPayments.find(p => p._id.year === year && p._id.month === month);
        const approvalData = monthlyApprovals.find(a => a._id.year === year && a._id.month === month);
        
        // Count payment types
        const paymentTypes = paymentData?.types || [];
        const typeCount = paymentTypes.reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        summary.unshift({
          month: `${year}-${String(month).padStart(2, '0')}`,
          monthName: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
          disbursed: paymentData?.totalDisbursed || 0,
          approved: approvalData?.totalApproved || 0,
          paymentCount: paymentData?.paymentCount || 0,
          applicationCount: approvalData?.applicationCount || 0,
          avgPaymentAmount: paymentData?.avgAmount || 0,
          paymentTypes: typeCount,
          efficiency: paymentData && approvalData ? 
            (paymentData.totalDisbursed / approvalData.totalApproved * 100) : 0
        });
      }

      // Calculate trends
      const summaryWithTrends = summary.map((item, index) => {
        const prevItem = summary[index - 1];
        let disbursedTrend = 0;
        let approvedTrend = 0;
        
        if (prevItem && prevItem.disbursed > 0) {
          disbursedTrend = ((item.disbursed - prevItem.disbursed) / prevItem.disbursed) * 100;
        }
        
        if (prevItem && prevItem.approved > 0) {
          approvedTrend = ((item.approved - prevItem.approved) / prevItem.approved) * 100;
        }

        return {
          ...item,
          trends: {
            disbursed: disbursedTrend,
            approved: approvedTrend
          }
        };
      });

      return ResponseHelper.success(res, { summary: summaryWithTrends });
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
      const { period } = req.query;
      const dateFilter = BudgetController.buildDateFilter(period);
      
      // Get category data from both projects and schemes with real financial data
      const categoryData = await Project.aggregate([
        {
          $match: { 
            status: { $ne: 'cancelled' },
            ...dateFilter
          }
        },
        {
          $lookup: {
            from: 'schemes',
            localField: '_id',
            foreignField: 'project',
            as: 'schemes'
          }
        },
        {
          $lookup: {
            from: 'applications',
            localField: '_id',
            foreignField: 'project',
            as: 'applications'
          }
        },
        {
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'project',
            as: 'payments'
          }
        },
        {
          $addFields: {
            // Calculate real allocated amount from approved applications
            realAllocated: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$applications',
                      cond: { $in: ['$$this.status', ['approved', 'disbursed', 'completed']] }
                    }
                  },
                  as: 'app',
                  in: '$$app.approvedAmount'
                }
              }
            },
            // Calculate real spent amount from completed payments
            realSpent: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$payments',
                      cond: { $eq: ['$$this.status', 'completed'] }
                    }
                  },
                  as: 'payment',
                  in: '$$payment.amount'
                }
              }
            },
            schemeCount: { $size: '$schemes' },
            applicationCount: { $size: '$applications' },
            beneficiaryCount: {
              $size: {
                $setUnion: {
                  $map: {
                    input: '$applications',
                    as: 'app',
                    in: '$$app.beneficiary'
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: '$category',
            totalBudget: { $sum: '$budget.total' },
            totalAllocated: { $sum: '$realAllocated' },
            totalSpent: { $sum: '$realSpent' },
            projectCount: { $sum: 1 },
            schemeCount: { $sum: '$schemeCount' },
            applicationCount: { $sum: '$applicationCount' },
            beneficiaryCount: { $sum: '$beneficiaryCount' },
            avgProjectBudget: { $avg: '$budget.total' }
          }
        },
        {
          $sort: { totalBudget: -1 }
        }
      ]);

      const categories = categoryData.map(item => {
        const totalBudget = item.totalBudget;
        const totalAllocated = item.totalAllocated;
        const totalSpent = item.totalSpent;
        
        return {
          category: item._id,
          categoryName: item._id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          totalBudget,
          totalAllocated,
          totalSpent,
          available: totalBudget - totalSpent,
          committed: totalAllocated, // Amount committed through approved applications
          utilizationRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
          allocationRate: totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0,
          projectCount: item.projectCount,
          schemeCount: item.schemeCount,
          applicationCount: item.applicationCount,
          beneficiaryCount: item.beneficiaryCount,
          avgProjectBudget: item.avgProjectBudget,
          efficiency: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0 // How efficiently allocated funds are being disbursed
        };
      });

      return ResponseHelper.success(res, { categories });
    } catch (error) {
      console.error('❌ Get Budget By Category Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch budget by category', 500);
    }
  }

  /**
   * Get budget analytics and insights
   * GET /api/budget/analytics
   */
  async getBudgetAnalytics(req, res) {
    try {
      // Get overall financial health metrics
      const [
        totalStats,
        categoryPerformance,
        monthlyTrends,
        topPerformingProjects,
        bottleneckAnalysis
      ] = await Promise.all([
        // Overall statistics
        this.getOverallStats(),
        // Category performance
        this.getCategoryPerformance(),
        // Monthly trends (last 6 months)
        this.getMonthlyTrends(6),
        // Top performing projects
        this.getTopPerformingProjects(5),
        // Bottleneck analysis
        this.getBottleneckAnalysis()
      ]);

      const analytics = {
        overview: totalStats,
        categoryPerformance,
        monthlyTrends,
        topPerformingProjects,
        bottleneckAnalysis,
        insights: this.generateInsights(totalStats, categoryPerformance, monthlyTrends)
      };

      return ResponseHelper.success(res, { analytics });
    } catch (error) {
      console.error('❌ Get Budget Analytics Error:', error);
      return ResponseHelper.error(res, 'Failed to fetch budget analytics', 500);
    }
  }

  // Helper methods for analytics
  async getOverallStats() {
    const stats = await Project.aggregate([
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'project',
          as: 'applications'
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'project',
          as: 'payments'
        }
      },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$budget.total' },
          totalAllocated: {
            $sum: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$applications',
                      cond: { $in: ['$$this.status', ['approved', 'disbursed', 'completed']] }
                    }
                  },
                  as: 'app',
                  in: '$$app.approvedAmount'
                }
              }
            }
          },
          totalDisbursed: {
            $sum: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$payments',
                      cond: { $eq: ['$$this.status', 'completed'] }
                    }
                  },
                  as: 'payment',
                  in: '$$payment.amount'
                }
              }
            }
          }
        }
      }
    ]);

    return stats[0] || { totalBudget: 0, totalAllocated: 0, totalDisbursed: 0 };
  }

  async getCategoryPerformance() {
    // Implementation for category performance analysis
    return [];
  }

  async getMonthlyTrends(months) {
    // Implementation for monthly trends
    return [];
  }

  async getTopPerformingProjects(limit) {
    // Implementation for top performing projects
    return [];
  }

  async getBottleneckAnalysis() {
    // Implementation for bottleneck analysis
    return {};
  }

  generateInsights(totalStats, categoryPerformance, monthlyTrends) {
    const insights = [];
    
    // Generate insights based on data
    if (totalStats.totalBudget > 0) {
      const utilizationRate = (totalStats.totalDisbursed / totalStats.totalBudget) * 100;
      
      if (utilizationRate < 50) {
        insights.push({
          type: 'warning',
          title: 'Low Budget Utilization',
          message: `Only ${utilizationRate.toFixed(1)}% of total budget has been utilized. Consider reviewing project timelines and disbursement processes.`
        });
      } else if (utilizationRate > 90) {
        insights.push({
          type: 'success',
          title: 'High Budget Utilization',
          message: `Excellent budget utilization at ${utilizationRate.toFixed(1)}%. Projects are effectively using allocated funds.`
        });
      }
    }

    return insights;
  }

  /**
   * Build date filter based on period parameter
   */
  static buildDateFilter(period) {
    if (!period) return {};

    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      
      case 'current_quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        break;
      
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      
      default:
        return {};
    }

    return {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };
  }

  /**
   * Build payment date filter for completed payments
   */
  static buildPaymentDateFilter(period) {
    if (!period) return {};

    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      
      case 'current_quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        break;
      
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      
      default:
        return {};
    }

    return {
      'timeline.completedAt': {
        $gte: startDate,
        $lte: endDate
      }
    };
  }
}

module.exports = new BudgetController();