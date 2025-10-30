// Use relative URL in development to leverage Vite proxy
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://localhost:5001/api';

// Types
export interface User {
  id: string;
  name: string;
  email?: string; // Made optional
  phone: string;
  role: string;
  adminScope?: {
    level: string;
    regions: string[];
    projects: string[];
    schemes: string[];
  };
  profile?: any;
  isVerified: boolean;
  isActive: boolean;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  priority: string;
  scope: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: {
    total: number;
    allocated: number;
    spent: number;
    currency: string;
  };
  progress: {
    percentage: number;
    milestones: Array<{
      name: string;
      description: string;
      targetDate: string;
      completedDate?: string;
      status: string;
    }>;
  };
  coordinator: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  targetRegions: Array<{
    id: string;
    name: string;
    type: string;
    code: string;
  }>;
  targetBeneficiaries: {
    estimated: number;
    actual: number;
  };
  budgetUtilization: number;
  remainingBudget: number;
  daysRemaining: number;
}

export interface Scheme {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  project: {
    id: string;
    name: string;
    code: string;
    description: string;
  };
  targetRegions: Array<{
    id: string;
    name: string;
    type: string;
    code: string;
  }>;
  eligibility: {
    ageRange?: {
      min?: number;
      max?: number;
    };
    gender?: string;
    incomeLimit?: number;
    familySize?: {
      min?: number;
      max?: number;
    };
    educationLevel?: string;
    employmentStatus?: string;
    documents: Array<{
      type: string;
      required: boolean;
      description: string;
    }>;
  };
  budget: {
    total: number;
    allocated: number;
    spent: number;
    currency: string;
  };
  benefits: {
    type: string;
    amount?: number;
    frequency: string;
    duration?: number;
    description: string;
  };
  applicationSettings: {
    startDate: string;
    endDate: string;
    maxApplications: number;
    maxBeneficiaries?: number;
    autoApproval: boolean;
    requiresInterview: boolean;
    allowMultipleApplications: boolean;
  };
  statistics: {
    totalApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    pendingApplications: number;
    totalBeneficiaries: number;
    totalAmountDisbursed: number;
  };
  budgetUtilization: number;
  remainingBudget: number;
  successRate: number;
  daysRemainingForApplication: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Always get the latest token from localStorage
    const currentToken = this.token || localStorage.getItem('auth_token');
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication Methods
  async requestOTP(phone: string, purpose: string = 'login'): Promise<ApiResponse<{
    expiresAt: string;
    attemptsRemaining: number;
    developmentOTP?: string;
  }>> {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose }),
    });
  }

  async verifyOTP(phone: string, otp: string, purpose: string = 'login'): Promise<ApiResponse<{
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    loginMethod: string;
  }>> {
    const response = await this.request<{
      user: User;
      accessToken: string;
      expiresIn: number;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, purpose }),
    });

    if (response.success && response.data) {
      // Handle the nested tokens structure from backend
      const accessToken = response.data.tokens?.accessToken || response.data.accessToken;
      if (accessToken) {
        this.token = accessToken;
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  // Project Methods
  async getProjects(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  }): Promise<ApiResponse<{
    projects: Project[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/projects${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getProject(id: string): Promise<ApiResponse<{ project: Project }>> {
    return this.request(`/projects/${id}`);
  }

  async createProject(projectData: Partial<Project>): Promise<ApiResponse<{ project: Project }>> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: Partial<Project>): Promise<ApiResponse<{ project: Project }>> {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<null>> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectStats(): Promise<ApiResponse<{
    overview: {
      totalProjects: number;
      totalBudget: number;
      totalAllocated: number;
      totalSpent: number;
      activeProjects: number;
      completedProjects: number;
      totalBeneficiaries: number;
    };
    byCategory: Array<{
      _id: string;
      count: number;
      totalBudget: number;
      totalBeneficiaries: number;
    }>;
    byStatus: Array<{
      _id: string;
      count: number;
    }>;
  }>> {
    return this.request('/projects/stats');
  }

  // Scheme Methods
  async getSchemes(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    project?: string;
    priority?: string;
    search?: string;
  }): Promise<ApiResponse<{
    schemes: Scheme[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
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

  async getSchemeStats(): Promise<ApiResponse<{
    overview: {
      totalSchemes: number;
      totalBudget: number;
      totalAllocated: number;
      totalSpent: number;
      activeSchemes: number;
      totalApplications: number;
      totalBeneficiaries: number;
      totalAmountDisbursed: number;
    };
    byCategory: Array<{
      _id: string;
      count: number;
      totalBudget: number;
      totalBeneficiaries: number;
    }>;
    byStatus: Array<{
      _id: string;
      count: number;
    }>;
  }>> {
    return this.request('/schemes/stats');
  }

  async getActiveSchemes(): Promise<ApiResponse<{ schemes: Scheme[] }>> {
    return this.request('/schemes/active');
  }

  // Form Configuration Methods
  async getFormConfiguration(schemeId: string): Promise<ApiResponse<{ formConfiguration: any }>> {
    return this.request(`/schemes/${schemeId}/form-config`);
  }

  async updateFormConfiguration(schemeId: string, config: any): Promise<ApiResponse<{ formConfiguration: any }>> {
    return this.request(`/schemes/${schemeId}/form-config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // User Methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<ApiResponse<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Utility Methods
  isAuthenticated(): boolean {
    // Always check localStorage for the latest token
    const currentToken = this.token || localStorage.getItem('auth_token');
    return !!currentToken;
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Enhanced User Methods
  async getUserStats(): Promise<ApiResponse<{
    overview: {
      totalUsers: number;
      activeUsers: number;
      verifiedUsers: number;
    };
    byRole: Array<{
      _id: string;
      count: number;
      active: number;
    }>;
    byRegion: Array<{
      _id: {
        regionId: string;
        regionName: string;
        regionType: string;
      };
      userCount: number;
    }>;
  }>> {
    return this.request('/users/statistics');
  }

  async getUsersByRole(role: string): Promise<ApiResponse<{ users: User[] }>> {
    return this.request(`/users/by-role/${role}`);
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<null>> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleUserStatus(id: string, isActive: boolean): Promise<ApiResponse<{ user: User }>> {
    return this.request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async resetUserPassword(id: string, newPassword: string): Promise<ApiResponse<null>> {
    return this.request(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async assignRole(id: string, role: string, adminScope?: any): Promise<ApiResponse<{ user: User }>> {
    return this.request(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, adminScope }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export convenience methods
export const auth = {
  requestOTP: (phone: string, purpose?: string) => apiClient.requestOTP(phone, purpose),
  verifyOTP: (phone: string, otp: string, purpose?: string) => apiClient.verifyOTP(phone, otp, purpose),
  getProfile: () => apiClient.getProfile(),
  logout: () => apiClient.logout(),
  isAuthenticated: () => apiClient.isAuthenticated(),
  getCurrentUser: () => apiClient.getCurrentUser(),
};

export const projects = {
  getAll: (params?: any) => apiClient.getProjects(params),
  getById: (id: string) => apiClient.getProject(id),
  create: (data: Partial<Project>) => apiClient.createProject(data),
  update: (id: string, data: Partial<Project>) => apiClient.updateProject(id, data),
  delete: (id: string) => apiClient.deleteProject(id),
  getStats: () => apiClient.getProjectStats(),
};

export const schemes = {
  getAll: (params?: any) => apiClient.getSchemes(params),
  getById: (id: string) => apiClient.getScheme(id),
  create: (data: Partial<Scheme>) => apiClient.createScheme(data),
  update: (id: string, data: Partial<Scheme>) => apiClient.updateScheme(id, data),
  delete: (id: string) => apiClient.deleteScheme(id),
  getStats: () => apiClient.getSchemeStats(),
  getActive: () => apiClient.getActiveSchemes(),
  getFormConfig: (id: string) => apiClient.getFormConfiguration(id),
  updateFormConfig: (id: string, config: any) => apiClient.updateFormConfiguration(id, config),
  publishForm: (id: string, data: { isPublished: boolean }) => apiClient.request(`/schemes/${id}/form-config/publish`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

export const users = {
  getAll: (params?: any) => apiClient.getUsers(params),
  getStats: () => apiClient.getUserStats(),
  getByRole: (role: string) => apiClient.getUsersByRole(role),
  create: (data: Partial<User>) => apiClient.createUser(data),
  update: (id: string, data: Partial<User>) => apiClient.updateUser(id, data),
  delete: (id: string) => apiClient.deleteUser(id),
  toggleStatus: (id: string, isActive: boolean) => apiClient.toggleUserStatus(id, isActive),
  resetPassword: (id: string, newPassword: string) => apiClient.resetUserPassword(id, newPassword),
  assignRole: (id: string, role: string, adminScope?: any) => apiClient.assignRole(id, role, adminScope),
};

// Location Types
export interface Location {
  id: string;
  name: string;
  type: 'state' | 'district' | 'area' | 'unit';
  code: string;
  parent?: {
    id: string;
    name: string;
    type: string;
    code: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  population?: number;
  area?: number;
  contactPerson?: {
    name: string;
    phone: string;
    email: string;
  };
  isActive: boolean;
  description?: string;
  establishedDate?: string;
  childrenCount?: number;
  fullPath?: string;
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Add location methods to ApiClient class
class ExtendedApiClient extends ApiClient {
  // Location Methods
  async getLocations(params?: {
    page?: number;
    limit?: number;
    type?: string;
    parent?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{
    locations: Location[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/locations${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getLocationHierarchy(parentId?: string): Promise<ApiResponse<{
    hierarchy: Location[];
  }>> {
    const endpoint = `/locations/hierarchy${parentId ? `?parentId=${parentId}` : ''}`;
    return this.request(endpoint);
  }

  async getLocation(id: string): Promise<ApiResponse<{ location: Location }>> {
    return this.request(`/locations/${id}`);
  }

  async createLocation(locationData: Partial<Location>): Promise<ApiResponse<{ location: Location }>> {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async updateLocation(id: string, locationData: Partial<Location>): Promise<ApiResponse<{ location: Location }>> {
    return this.request(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }

  async deleteLocation(id: string): Promise<ApiResponse<null>> {
    return this.request(`/locations/${id}`, {
      method: 'DELETE',
    });
  }

  async getLocationStats(): Promise<ApiResponse<{
    overview: {
      total: number;
      recentlyAdded: number;
    };
    byType: Array<{
      _id: string;
      count: number;
      active: number;
    }>;
  }>> {
    return this.request('/locations/statistics');
  }

  async getLocationsByType(type: string, params?: {
    parent?: string;
    active?: boolean;
  }): Promise<ApiResponse<{ locations: Location[] }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/locations/by-type/${type}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Beneficiary Methods
  async getBeneficiaries(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    state?: string;
    district?: string;
    area?: string;
    unit?: string;
  }): Promise<ApiResponse<{
    beneficiaries: any[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/beneficiaries${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getBeneficiary(id: string): Promise<ApiResponse<any>> {
    return this.request(`/beneficiaries/${id}`);
  }

  async createBeneficiary(beneficiaryData: any): Promise<ApiResponse<any>> {
    return this.request('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(beneficiaryData),
    });
  }

  async updateBeneficiary(id: string, beneficiaryData: any): Promise<ApiResponse<any>> {
    return this.request(`/beneficiaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(beneficiaryData),
    });
  }

  async deleteBeneficiary(id: string): Promise<ApiResponse<null>> {
    return this.request(`/beneficiaries/${id}`, {
      method: 'DELETE',
    });
  }

  async verifyBeneficiary(id: string): Promise<ApiResponse<any>> {
    return this.request(`/beneficiaries/${id}/verify`, {
      method: 'PATCH',
    });
  }

  // Application Methods
  async getApplications(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    scheme?: string;
    project?: string;
    state?: string;
    district?: string;
    area?: string;
    unit?: string;
  }): Promise<ApiResponse<{
    applications: any[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/applications${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getApplication(id: string): Promise<ApiResponse<any>> {
    return this.request(`/applications/${id}`);
  }

  async createApplication(applicationData: any): Promise<ApiResponse<any>> {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async updateApplication(id: string, applicationData: any): Promise<ApiResponse<any>> {
    return this.request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(applicationData),
    });
  }

  async reviewApplication(id: string, reviewData: any): Promise<ApiResponse<any>> {
    return this.request(`/applications/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
    });
  }

  async approveApplication(id: string, approvalData: any): Promise<ApiResponse<any>> {
    return this.request(`/applications/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(approvalData),
    });
  }

  async deleteApplication(id: string): Promise<ApiResponse<null>> {
    return this.request(`/applications/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create extended API client instance
const extendedApiClient = new ExtendedApiClient(API_BASE_URL);

export const locations = {
  getAll: (params?: any) => extendedApiClient.getLocations(params),
  getHierarchy: (parentId?: string) => extendedApiClient.getLocationHierarchy(parentId),
  getById: (id: string) => extendedApiClient.getLocation(id),
  create: (data: Partial<Location>) => extendedApiClient.createLocation(data),
  update: (id: string, data: Partial<Location>) => extendedApiClient.updateLocation(id, data),
  delete: (id: string) => extendedApiClient.deleteLocation(id),
  getStats: () => extendedApiClient.getLocationStats(),
  getByType: (type: string, params?: any) => extendedApiClient.getLocationsByType(type, params),
};

export const beneficiaries = {
  getAll: (params?: any) => extendedApiClient.getBeneficiaries(params),
  getById: (id: string) => extendedApiClient.getBeneficiary(id),
  create: (data: any) => extendedApiClient.createBeneficiary(data),
  update: (id: string, data: any) => extendedApiClient.updateBeneficiary(id, data),
  delete: (id: string) => extendedApiClient.deleteBeneficiary(id),
  verify: (id: string) => extendedApiClient.verifyBeneficiary(id),
};

export const applications = {
  getAll: (params?: any) => extendedApiClient.getApplications(params),
  getById: (id: string) => extendedApiClient.getApplication(id),
  create: (data: any) => extendedApiClient.createApplication(data),
  update: (id: string, data: any) => extendedApiClient.updateApplication(id, data),
  review: (id: string, data: any) => extendedApiClient.reviewApplication(id, data),
  approve: (id: string, data: any) => extendedApiClient.approveApplication(id, data),
  delete: (id: string) => extendedApiClient.deleteApplication(id),
};

export const budget = {
  getOverview: () => extendedApiClient.request('/budget/overview'),
  getProjects: () => extendedApiClient.request('/budget/projects'),
  getSchemes: () => extendedApiClient.request('/budget/schemes'),
  getTransactions: (limit?: number) => extendedApiClient.request(`/budget/transactions${limit ? `?limit=${limit}` : ''}`),
  getMonthlySummary: (year?: number, months?: number) => extendedApiClient.request(`/budget/monthly-summary${year || months ? `?${new URLSearchParams({ ...(year && { year: year.toString() }), ...(months && { months: months.toString() }) }).toString()}` : ''}`),
  getByCategory: () => extendedApiClient.request('/budget/by-category'),
};

export const donors = {
  getAll: (params?: any) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = `/donors${queryString ? `?${queryString}` : ''}`;
    return extendedApiClient.request(url);
  },
  getById: (id: string) => extendedApiClient.request(`/donors/${id}`),
  create: (data: any) => extendedApiClient.request('/donors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => extendedApiClient.request(`/donors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => extendedApiClient.request(`/donors/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) => extendedApiClient.request(`/donors/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  verify: (id: string, data: any) => extendedApiClient.request(`/donors/${id}/verify`, { method: 'PATCH', body: JSON.stringify(data) }),
  getStats: () => extendedApiClient.request('/donors/stats'),
  getTop: (limit?: number) => extendedApiClient.request(`/donors/top${limit ? `?limit=${limit}` : ''}`),
  getTrends: (months?: number) => extendedApiClient.request(`/donors/trends${months ? `?months=${months}` : ''}`),
  search: (query: string, limit?: number) => extendedApiClient.request(`/donors/search?q=${encodeURIComponent(query)}${limit ? `&limit=${limit}` : ''}`),
  getSuggestions: (programId?: string) => extendedApiClient.request(`/donors/suggestions${programId ? `?programId=${programId}` : ''}`),
  bulkUpdateStatus: (donorIds: string[], status: string) => extendedApiClient.request('/donors/bulk/status', { method: 'PATCH', body: JSON.stringify({ donorIds, status }) }),
  bulkAssignTags: (donorIds: string[], tags: string[]) => extendedApiClient.request('/donors/bulk/tags', { method: 'PATCH', body: JSON.stringify({ donorIds, tags }) }),
  sendCommunication: (data: any) => extendedApiClient.request('/donors/communicate', { method: 'POST', body: JSON.stringify(data) }),
};

export const donations = {
  getAll: (params?: any) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = `/donations${queryString ? `?${queryString}` : ''}`;
    return extendedApiClient.request(url);
  },
  getById: (id: string) => extendedApiClient.request(`/donations/${id}`),
  create: (data: any) => extendedApiClient.request('/donations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => extendedApiClient.request(`/donations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => extendedApiClient.request(`/donations/${id}`, { method: 'DELETE' }),
  getStats: () => extendedApiClient.request('/donations/stats'),
  getRecent: (limit?: number) => extendedApiClient.request(`/donations/recent${limit ? `?limit=${limit}` : ''}`),
  getByDonor: (donorId: string, params?: any) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return extendedApiClient.request(`/donations/donor/${donorId}${queryString ? `?${queryString}` : ''}`);
  },
};



export const dashboard = {
  getOverview: () => extendedApiClient.request('/dashboard/overview'),
  getRecentApplications: (limit?: number) => extendedApiClient.request(`/dashboard/recent-applications${limit ? `?limit=${limit}` : ''}`),
  getRecentPayments: (limit?: number) => extendedApiClient.request(`/dashboard/recent-payments${limit ? `?limit=${limit}` : ''}`),
  getMonthlyTrends: (months?: number) => extendedApiClient.request(`/dashboard/monthly-trends${months ? `?months=${months}` : ''}`),
  getProjectPerformance: () => extendedApiClient.request('/dashboard/project-performance'),
};

export const interviews = {
  getAll: (params?: any) => extendedApiClient.request(`/interviews${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  schedule: (applicationId: string, data: any) => extendedApiClient.request(`/interviews/schedule/${applicationId}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (applicationId: string, data: any) => extendedApiClient.request(`/interviews/${applicationId}`, { method: 'PUT', body: JSON.stringify(data) }),
  complete: (applicationId: string, data: any) => extendedApiClient.request(`/interviews/${applicationId}/complete`, { method: 'PATCH', body: JSON.stringify(data) }),
  cancel: (applicationId: string, data: any) => extendedApiClient.request(`/interviews/${applicationId}/cancel`, { method: 'PATCH', body: JSON.stringify(data) }),
  getHistory: (applicationId: string) => extendedApiClient.request(`/interviews/history/${applicationId}`),
};

export const reports = {
  getByApplication: (applicationId: string, params?: any) => extendedApiClient.request(`/reports/application/${applicationId}${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  create: (applicationId: string, data: any) => extendedApiClient.request(`/reports/application/${applicationId}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (reportId: string, data: any) => extendedApiClient.request(`/reports/${reportId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (reportId: string) => extendedApiClient.request(`/reports/${reportId}`, { method: 'DELETE' }),
};

// RBAC Management
export const rbac = {
  // Role Management
  getRoles: (params?: { category?: string; type?: string; isActive?: boolean }) => 
    extendedApiClient.request(`/rbac/roles${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`),
  getRoleById: (id: string) => extendedApiClient.request(`/rbac/roles/${id}`),
  getRoleHierarchy: () => extendedApiClient.request('/rbac/roles/hierarchy'),
  createRole: (data: any) => extendedApiClient.request('/rbac/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: string, data: any) => extendedApiClient.request(`/rbac/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRole: (id: string) => extendedApiClient.request(`/rbac/roles/${id}`, { method: 'DELETE' }),
  getUsersWithRole: (roleId: string, includeExpired?: boolean) => 
    extendedApiClient.request(`/rbac/roles/${roleId}/users${includeExpired ? '?includeExpired=true' : ''}`),
  
  // Permission Management
  getPermissions: (params?: { module?: string; category?: string; scope?: string; securityLevel?: string }) => 
    extendedApiClient.request(`/rbac/permissions${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`),
  getPermissionById: (id: string) => extendedApiClient.request(`/rbac/permissions/${id}`),
  
  // User Role Assignment
  assignRole: (userId: string, data: { roleId: string; reason?: string; validUntil?: string; isPrimary?: boolean; isTemporary?: boolean; scope?: any }) => 
    extendedApiClient.request(`/rbac/users/${userId}/roles`, { method: 'POST', body: JSON.stringify(data) }),
  removeRole: (userId: string, roleId: string, reason?: string) => 
    extendedApiClient.request(`/rbac/users/${userId}/roles/${roleId}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
  getUserRoles: (userId: string) => extendedApiClient.request(`/rbac/users/${userId}/roles`),
  getUserPermissions: (userId: string) => extendedApiClient.request(`/rbac/users/${userId}/permissions`),
  checkPermission: (userId: string, permission: string, context?: any) => 
    extendedApiClient.request(`/rbac/users/${userId}/check-permission`, { 
      method: 'POST', 
      body: JSON.stringify({ permission, context }) 
    }),
  
  // User Role Permission Management
  addPermissionToUserRole: (userRoleId: string, data: { permissionId: string; reason: string; expiresAt?: string }) => 
    extendedApiClient.request(`/rbac/user-roles/${userRoleId}/permissions`, { method: 'POST', body: JSON.stringify(data) }),
  restrictPermissionFromUserRole: (userRoleId: string, data: { permissionId: string; reason: string; expiresAt?: string }) => 
    extendedApiClient.request(`/rbac/user-roles/${userRoleId}/restrictions`, { method: 'POST', body: JSON.stringify(data) }),
  
  // System Management
  initializeRBAC: () => extendedApiClient.request('/rbac/initialize', { method: 'POST' }),
  getStats: () => extendedApiClient.request('/rbac/stats'),
  cleanupExpired: () => extendedApiClient.request('/rbac/cleanup', { method: 'POST' }),
};

// Export api as alias for apiClient for backward compatibility
export const api = extendedApiClient;