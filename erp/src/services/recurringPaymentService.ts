import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RecurringConfig {
  period: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  numberOfPayments: number;
  amountPerPayment: number;
  startDate: string;
  customAmounts?: Array<{
    paymentNumber: number;
    amount: number;
    description?: string;
  }>;
}

export interface RecurringPayment {
  _id: string;
  application: any;
  beneficiary: any;
  scheme: any;
  project?: any;
  paymentNumber: number;
  totalPayments: number;
  scheduledDate: string;
  dueDate: string;
  amount: number;
  description: string;
  status: 'scheduled' | 'due' | 'overdue' | 'processing' | 'completed' | 'failed' | 'skipped' | 'cancelled';
  actualPaymentDate?: string;
  payment?: any;
  paidAmount?: number;
  notes?: string;
  isOverdue?: boolean;
  daysUntilDue?: number;
  daysOverdue?: number;
}

export interface RecurringApplication {
  _id: string;
  applicationNumber: string;
  beneficiary: any;
  scheme: any;
  project?: any;
  requestedAmount: number;
  approvedAmount: number;
  isRecurring: boolean;
  recurringConfig: {
    enabled: boolean;
    period: string;
    numberOfPayments: number;
    amountPerPayment: number;
    startDate: string;
    endDate?: string;
    totalRecurringAmount: number;
    completedPayments: number;
    nextPaymentDate?: string;
    lastPaymentDate?: string;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
  };
}

export interface BudgetForecast {
  summary: {
    totalAmount: number;
    totalPayments: number;
    overdueAmount: number;
    overduePayments: number;
    averagePayment: number;
  };
  monthlyForecast: Array<{
    month: string;
    totalAmount: number;
    paymentCount: number;
    overdueCount: number;
    scheduledCount: number;
  }>;
  schemeBreakdown: Array<{
    scheme: string;
    totalAmount: number;
    count: number;
  }>;
  projectBreakdown: Array<{
    project: string;
    totalAmount: number;
    count: number;
  }>;
}

export interface DashboardStats {
  totalPayments: number;
  scheduled: number;
  overdue: number;
  completed: number;
  upcoming: {
    next7Days: number;
    next30Days: number;
  };
  amounts: {
    total: number;
    completed: number;
    pending: number;
  };
  overdueList: RecurringPayment[];
}

// Generate recurring payment schedule for an application
export const generateRecurringSchedule = async (applicationId: string, recurringConfig: RecurringConfig) => {
  const response = await api.post(`/recurring-payments/generate-schedule/${applicationId}`, {
    recurringConfig,
  });
  return response.data;
};

// Get all applications with recurring payments
export const getRecurringApplications = async (filters?: {
  scheme?: string;
  project?: string;
  status?: string;
  state?: string;
  district?: string;
  area?: string;
  unit?: string;
}) => {
  // Filter out 'all' values
  const cleanFilters = Object.entries(filters || {}).reduce((acc, [key, value]) => {
    if (value && value !== 'all') {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
  
  const response = await api.get('/recurring-payments/applications', { params: cleanFilters });
  return response.data;
};

// Get recurring payment schedule for a specific application
export const getApplicationSchedule = async (applicationId: string) => {
  const response = await api.get(`/recurring-payments/applications/${applicationId}/schedule`);
  return response.data;
};

// Get upcoming recurring payments
export const getUpcomingPayments = async (days: number = 30, filters?: any) => {
  const response = await api.get('/recurring-payments/upcoming', {
    params: { days, ...filters },
  });
  return response.data;
};

// Get overdue recurring payments
export const getOverduePayments = async (filters?: any) => {
  const response = await api.get('/recurring-payments/overdue', { params: filters });
  return response.data;
};

// Get budget forecast
export const getBudgetForecast = async (months: number = 12, filters?: any): Promise<{ forecast: BudgetForecast; months: number }> => {
  const response = await api.get('/recurring-payments/forecast', {
    params: { months, ...filters },
  });
  return response.data;
};

// Get dashboard statistics
export const getDashboardStats = async (filters?: any): Promise<DashboardStats> => {
  // Filter out 'all' values
  const cleanFilters = Object.entries(filters || {}).reduce((acc, [key, value]) => {
    if (value && value !== 'all') {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
  
  const response = await api.get('/recurring-payments/dashboard', { params: cleanFilters });
  return response.data;
};

// Get single recurring payment details
export const getRecurringPayment = async (paymentId: string) => {
  const response = await api.get(`/recurring-payments/${paymentId}`);
  return response.data;
};

// Record a recurring payment as completed
export const recordPayment = async (
  paymentId: string,
  paymentData: {
    amount?: number;
    method: 'bank_transfer' | 'cheque' | 'cash' | 'digital_wallet' | 'upi';
    transactionReference?: string;
    bankTransfer?: any;
    cheque?: any;
    notes?: string;
  }
) => {
  const response = await api.post(`/recurring-payments/${paymentId}/record`, paymentData);
  return response.data;
};

// Update a recurring payment
export const updateRecurringPayment = async (
  paymentId: string,
  updateData: {
    scheduledDate?: string;
    dueDate?: string;
    amount?: number;
    description?: string;
    notes?: string;
  }
) => {
  const response = await api.put(`/recurring-payments/${paymentId}`, updateData);
  return response.data;
};

// Cancel a recurring payment
export const cancelRecurringPayment = async (paymentId: string, reason: string) => {
  const response = await api.delete(`/recurring-payments/${paymentId}/cancel`, {
    data: { reason },
  });
  return response.data;
};

// Update overdue statuses (for admin/cron)
export const updateOverdueStatuses = async () => {
  const response = await api.post('/recurring-payments/update-overdue');
  return response.data;
};

export default {
  generateRecurringSchedule,
  getRecurringApplications,
  getApplicationSchedule,
  getUpcomingPayments,
  getOverduePayments,
  getBudgetForecast,
  getDashboardStats,
  getRecurringPayment,
  recordPayment,
  updateRecurringPayment,
  cancelRecurringPayment,
  updateOverdueStatuses,
};
