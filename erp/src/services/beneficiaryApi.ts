const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface OTPResponse {
  message: string;
  phone: string;
  expiresIn: number;
  developmentOTP?: string;
  developmentNote?: string;
  staticOTP?: string;
  note?: string;
}

interface LoginResponse {
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    isVerified: boolean;
    profile: any;
  };
  token: string;
  message: string;
}

interface Scheme {
  _id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  project: {
    _id: string;
    name: string;
  };
  benefitType: string;
  maxAmount: number;
  benefitFrequency: string;
  benefitDescription: string;
  applicationDeadline: string;
  daysRemaining: number;
  requiresInterview: boolean;
  allowMultipleApplications: boolean;
  eligibilityCriteria: string[];
  beneficiariesCount: number;
  totalApplications: number;
  successRate: number;
  hasApplied: boolean;
  existingApplicationId?: string;
  existingApplicationStatus?: string;
  hasFormConfiguration: boolean;
  isUrgent: boolean;
  isPopular: boolean;
  isNew: boolean;
}

interface Application {
  _id: string;
  applicationId: string;
  scheme: {
    _id: string;
    name: string;
    category: string;
    maxAmount: number;
  };
  status: string;
  submittedAt: string;
  formData: any;
}

class BeneficiaryApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('beneficiary_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data.data;
  }

  // Authentication methods
  async sendOTP(phone: string): Promise<OTPResponse> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });

    return this.handleResponse<OTPResponse>(response);
  }

  async verifyOTP(phone: string, otp: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });

    const data = await this.handleResponse<LoginResponse>(response);
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('beneficiary_token', data.token);
      localStorage.setItem('beneficiary_user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async resendOTP(phone: string): Promise<OTPResponse> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });

    return this.handleResponse<OTPResponse>(response);
  }

  async getProfile(): Promise<{ user: any }> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/auth/profile`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<{ user: any }>(response);
  }

  async updateProfile(profileData: any): Promise<{ user: any }> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });

    return this.handleResponse<{ user: any }>(response);
  }

  // Scheme methods
  async getAvailableSchemes(params?: {
    category?: string;
    search?: string;
  }): Promise<{ 
    schemes: Scheme[]; 
    total: number; 
    categories: string[];
    summary: {
      totalActive: number;
      notApplied: number;
      urgent: number;
      requireInterview: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(
      `${API_BASE_URL}/beneficiary/schemes?${queryParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );

    return this.handleResponse<{ 
      schemes: Scheme[]; 
      total: number; 
      categories: string[];
      summary: {
        totalActive: number;
        notApplied: number;
        urgent: number;
        requireInterview: number;
      };
    }>(response);
  }

  async getSchemeDetails(schemeId: string): Promise<{ scheme: Scheme & { hasApplied: boolean; existingApplicationId?: string } }> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/schemes/${schemeId}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<{ scheme: Scheme & { hasApplied: boolean; existingApplicationId?: string } }>(response);
  }

  // Application methods
  async submitApplication(applicationData: {
    schemeId: string;
    formData: any;
    documents?: any[];
  }): Promise<{ application: Application }> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/applications`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(applicationData)
    });

    return this.handleResponse<{ application: Application }>(response);
  }

  async getMyApplications(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    applications: Application[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(
      `${API_BASE_URL}/beneficiary/applications?${queryParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );

    return this.handleResponse<{
      applications: Application[];
      pagination: {
        current: number;
        pages: number;
        total: number;
        limit: number;
      };
    }>(response);
  }

  async getApplicationDetails(applicationId: string): Promise<{ application: Application }> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/applications/${applicationId}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<{ application: Application }>(response);
  }

  async trackApplication(applicationId: string): Promise<{ application: Application }> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/track/${applicationId}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<{ application: Application }>(response);
  }

  async cancelApplication(applicationId: string, reason?: string): Promise<{ application: Application }> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/applications/${applicationId}/cancel`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason })
    });

    return this.handleResponse<{ application: Application }>(response);
  }

  async getApplicationStats(): Promise<{
    stats: {
      total: number;
      submitted: number;
      under_review: number;
      approved: number;
      rejected: number;
      completed: number;
      cancelled: number;
      totalApprovedAmount: number;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/beneficiary/stats`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<{
      stats: {
        total: number;
        submitted: number;
        under_review: number;
        approved: number;
        rejected: number;
        completed: number;
        cancelled: number;
        totalApprovedAmount: number;
      };
    }>(response);
  }

  // Utility methods
  logout(): void {
    localStorage.removeItem('beneficiary_token');
    localStorage.removeItem('beneficiary_user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('beneficiary_token');
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('beneficiary_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const beneficiaryApi = new BeneficiaryApiService();
export default beneficiaryApi;