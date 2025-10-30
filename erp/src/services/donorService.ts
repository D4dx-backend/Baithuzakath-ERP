import { donors, donations, api } from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/lib/api';
import { 
  Donor, 
  Campaign, 
  DonorFilters, 
  DonorStats,
  DonorFormData
} from '@/types/donor';

class DonorService {
  private baseUrl = '/donors';

  // Donor CRUD Operations
  async getAll(filters?: DonorFilters): Promise<PaginatedResponse<Donor>> {
    const response = await donors.getAll(filters);
    return response.data || response;
  }

  async getById(id: string): Promise<ApiResponse<Donor>> {
    const response = await donors.getById(id);
    return response.data;
  }

  async create(data: DonorFormData): Promise<ApiResponse<Donor>> {
    const response = await donors.create(data);
    return response.data;
  }

  async update(id: string, data: Partial<DonorFormData>): Promise<ApiResponse<Donor>> {
    const response = await donors.update(id, data);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await donors.delete(id);
    return response.data;
  }

  // Donor Status Management
  async updateStatus(id: string, status: Donor['status']): Promise<ApiResponse<Donor>> {
    const response = await donors.updateStatus(id, status);
    return response.data;
  }

  async verifyDonor(id: string, verificationData: {
    status: 'verified' | 'rejected';
    notes?: string;
  }): Promise<ApiResponse<Donor>> {
    const response = await donors.verify(id, verificationData);
    return response.data;
  }



  // Statistics and Analytics
  async getStats(): Promise<ApiResponse<DonorStats>> {
    const response = await donors.getStats();
    return response.data;
  }

  async getDonorTrends(months: number = 12): Promise<ApiResponse<{
    trends: Array<{
      month: string;
      newDonors: number;
      totalDonations: number;
      averageDonation: number;
    }>;
  }>> {
    const response = await donors.getTrends(months);
    return response.data;
  }

  async getTopDonors(limit: number = 10): Promise<ApiResponse<{
    donors: Array<{
      id: string;
      name: string;
      totalDonated: number;
      donationCount: number;
      lastDonation: string;
      category: string;
    }>;
  }>> {
    const response = await donors.getTop(limit);
    return response.data;
  }

  async getRecentDonations(limit: number = 10): Promise<ApiResponse<{
    donations: Array<{
      id: string;
      donationId: string;
      donor: {
        id: string;
        name: string;
        email: string;
        phone: string;
        type: string;
        category: string;
      };
      amount: number;
      method: string;
      purpose: string;
      program?: string;
      isRecurring: boolean;
      receiptNumber?: string;
      status: string;
      createdAt: string;
      completedAt?: string;
    }>;
  }>> {
    const response = await donations.getRecent(limit);
    return response.data;
  }

  // Campaign Management
  async getCampaigns(): Promise<ApiResponse<{ campaigns: Campaign[] }>> {
    const response = await api.request('/campaigns');
    return response;
  }

  async createCampaign(data: Partial<Campaign>): Promise<ApiResponse<Campaign>> {
    const response = await api.request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<ApiResponse<Campaign>> {
    const response = await api.request(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  }

  // Communication
  async sendCommunication(data: {
    donorIds: string[];
    type: 'email' | 'sms' | 'whatsapp';
    template: string;
    subject?: string;
    message: string;
    scheduledAt?: string;
  }): Promise<ApiResponse<{ messageId: string }>> {
    const response = await donors.sendCommunication(data);
    return response.data;
  }

  // Export and Import
  async exportDonors(filters?: DonorFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    
    params.append('format', format);

    const response = await fetch(`/api${this.baseUrl}/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.blob();
  }

  async importDonors(file: File): Promise<ApiResponse<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api${this.baseUrl}/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });

    return response.json();
  }

  // Bulk Operations
  async bulkUpdateStatus(donorIds: string[], status: Donor['status']): Promise<ApiResponse<{
    updated: number;
    failed: number;
  }>> {
    const response = await donors.bulkUpdateStatus(donorIds, status);
    return response.data;
  }

  async bulkAssignTags(donorIds: string[], tags: string[]): Promise<ApiResponse<{
    updated: number;
    failed: number;
  }>> {
    const response = await donors.bulkAssignTags(donorIds, tags);
    return response.data;
  }

  // Search and Suggestions
  async searchDonors(query: string, limit: number = 10): Promise<ApiResponse<{
    donors: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      totalDonated: number;
    }>;
  }>> {
    const response = await donors.search(query, limit);
    return response.data;
  }

  async getDonorSuggestions(programId?: string): Promise<ApiResponse<{
    suggestions: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      lastDonation: string;
      affinity: number;
    }>;
  }>> {
    const response = await donors.getSuggestions(programId);
    return response.data;
  }

  // Donation Recording
  async recordDonation(data: {
    donorId: string | null;
    amount: number;
    date: string;
    purpose: 'project' | 'scheme';
    purposeId: string;
    method: string;
    mode: string;
    receiptNumber?: string;
    notes?: string;
    isAnonymous: boolean;
  }): Promise<ApiResponse<any>> {
    const response = await donations.create(data);
    return response.data;
  }
}

export const donorService = new DonorService();