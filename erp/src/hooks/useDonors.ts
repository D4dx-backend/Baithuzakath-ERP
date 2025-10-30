import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donorService } from '@/services/donorService';
import { 
  DonorFilters, 
  DonorFormData,
  Donor 
} from '@/types/donor';
import { toast } from '@/hooks/use-toast';

// Donor Queries
export const useDonors = (filters?: DonorFilters) => {
  return useQuery({
    queryKey: ['donors', filters],
    queryFn: () => donorService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDonor = (id: string) => {
  return useQuery({
    queryKey: ['donors', id],
    queryFn: () => donorService.getById(id),
    enabled: !!id,
  });
};

export const useDonorStats = () => {
  return useQuery({
    queryKey: ['donors', 'stats'],
    queryFn: () => donorService.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDonorTrends = (months: number = 12) => {
  return useQuery({
    queryKey: ['donors', 'trends', months],
    queryFn: () => donorService.getDonorTrends(months),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useTopDonors = (limit: number = 10) => {
  return useQuery({
    queryKey: ['donors', 'top', limit],
    queryFn: () => donorService.getTopDonors(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};



export const useRecentDonations = (limit: number = 10) => {
  return useQuery({
    queryKey: ['donations', 'recent', limit],
    queryFn: () => donorService.getRecentDonations(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Campaign Queries
export const useCampaigns = () => {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: () => donorService.getCampaigns(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Search Queries
export const useSearchDonors = (query: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['donors', 'search', query, limit],
    queryFn: () => donorService.searchDonors(query, limit),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useDonorSuggestions = (programId?: string) => {
  return useQuery({
    queryKey: ['donors', 'suggestions', programId],
    queryFn: () => donorService.getDonorSuggestions(programId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Donor Mutations
export const useCreateDonor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DonorFormData) => donorService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donors', 'stats'] });
      toast({
        title: 'Success',
        description: 'Donor created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create donor',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateDonor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DonorFormData> }) =>
      donorService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donors', id] });
      queryClient.invalidateQueries({ queryKey: ['donors', 'stats'] });
      toast({
        title: 'Success',
        description: 'Donor updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update donor',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteDonor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => donorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donors', 'stats'] });
      toast({
        title: 'Success',
        description: 'Donor deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete donor',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateDonorStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Donor['status'] }) =>
      donorService.updateStatus(id, status),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donors', id] });
      queryClient.invalidateQueries({ queryKey: ['donors', 'stats'] });
      toast({
        title: 'Success',
        description: 'Donor status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update donor status',
        variant: 'destructive',
      });
    },
  });
};

export const useVerifyDonor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, verificationData }: { 
      id: string; 
      verificationData: { status: 'verified' | 'rejected'; notes?: string } 
    }) => donorService.verifyDonor(id, verificationData),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donors', id] });
      toast({
        title: 'Success',
        description: 'Donor verification updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update donor verification',
        variant: 'destructive',
      });
    },
  });
};



// Communication Mutations
export const useSendCommunication = () => {
  return useMutation({
    mutationFn: (data: {
      donorIds: string[];
      type: 'email' | 'sms' | 'whatsapp';
      template: string;
      subject?: string;
      message: string;
      scheduledAt?: string;
    }) => donorService.sendCommunication(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Communication sent successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send communication',
        variant: 'destructive',
      });
    },
  });
};

// Bulk Operations
export const useBulkUpdateDonorStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ donorIds, status }: { donorIds: string[]; status: Donor['status'] }) =>
      donorService.bulkUpdateStatus(donorIds, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donors', 'stats'] });
      toast({
        title: 'Success',
        description: `Updated ${response.data?.updated} donors successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update donors',
        variant: 'destructive',
      });
    },
  });
};

export const useBulkAssignTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ donorIds, tags }: { donorIds: string[]; tags: string[] }) =>
      donorService.bulkAssignTags(donorIds, tags),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      toast({
        title: 'Success',
        description: `Updated ${response.data?.updated} donors successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign tags',
        variant: 'destructive',
      });
    },
  });
};

// Re-export donation mutation from donations hook
export { useCreateDonation as useRecordDonation } from './useDonations';

