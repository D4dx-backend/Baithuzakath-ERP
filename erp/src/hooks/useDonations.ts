import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donationService, DonationFilters, Donation } from '@/services/donationService';
import { toast } from '@/hooks/use-toast';

// Donation Queries
export const useDonations = (filters?: DonationFilters) => {
  return useQuery({
    queryKey: ['donations', filters],
    queryFn: () => donationService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDonation = (id: string) => {
  return useQuery({
    queryKey: ['donations', id],
    queryFn: () => donationService.getById(id),
    enabled: !!id,
  });
};

export const useDonationStats = () => {
  return useQuery({
    queryKey: ['donations', 'stats'],
    queryFn: () => donationService.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useRecentDonations = (limit: number = 20) => {
  return useQuery({
    queryKey: ['donors', 'recent-donations', limit],
    queryFn: () => donationService.getRecent(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDonationHistory = (filters?: DonationFilters) => {
  return useQuery({
    queryKey: ['donors', 'donation-history', filters],
    queryFn: () => donationService.getHistory(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDonorDonations = (donorId: string, filters?: DonationFilters) => {
  return useQuery({
    queryKey: ['donations', 'donor', donorId, filters],
    queryFn: () => donationService.getByDonor(donorId, filters),
    enabled: !!donorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Donation Mutations
export const useCreateDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
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
    }) => donationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      toast({
        title: 'Success',
        description: 'Donation recorded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record donation',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Donation> }) =>
      donationService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donations', id] });
      toast({
        title: 'Success',
        description: 'Donation updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update donation',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => donationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast({
        title: 'Success',
        description: 'Donation deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete donation',
        variant: 'destructive',
      });
    },
  });
};