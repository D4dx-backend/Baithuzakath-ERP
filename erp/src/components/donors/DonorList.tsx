import { useState } from 'react';
// Removed tanstack/react-table dependency
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  Download,
  Filter,
  Search
} from 'lucide-react';
import { useDonors, useDeleteDonor, useUpdateDonorStatus } from '@/hooks/useDonors';
import { Donor, DonorFilters } from '@/types/donor';
import { useRBAC } from '@/hooks/useRBAC';
import { toast } from '@/hooks/use-toast';

interface DonorListProps {
  onEdit: (donor: Donor) => void;
  onView: (donor: Donor) => void;
  selectedDonors: string[];
  onSelectionChange: (selected: string[]) => void;
}

export const DonorList: React.FC<DonorListProps> = ({
  onEdit,
  onView,
  selectedDonors,
  onSelectionChange,
}) => {
  const { hasPermission } = useRBAC();
  const [filters, setFilters] = useState<DonorFilters>({
    search: '',
    type: '',
    category: '',
    status: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading, error } = useDonors(filters);
  const deleteDonor = useDeleteDonor();
  const updateDonorStatus = useUpdateDonorStatus();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'patron':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'major':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'recurring':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDelete = async (donor: Donor) => {
    if (window.confirm(`Are you sure you want to delete ${donor.name}?`)) {
      try {
        await deleteDonor.mutateAsync(donor.id);
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
  };

  const handleStatusChange = async (donor: Donor, newStatus: Donor['status']) => {
    try {
      await updateDonorStatus.mutateAsync({ id: donor.id, status: newStatus });
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const columns = [
    {
      id: 'select',
      header: 'Select',
      cell: ({ row }) => (
        <Checkbox
          checked={selectedDonors.includes(row.original.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelectionChange([...selectedDonors, row.original.id]);
            } else {
              onSelectionChange(selectedDonors.filter(id => id !== row.original.id));
            }
          }}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Donor',
      cell: ({ row }) => {
        const donor = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                {getInitials(donor.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{donor.name}</div>
              <div className="text-sm text-muted-foreground">{donor.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {row.original.phone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type || 'individual'}
        </Badge>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge className={getCategoryColor(row.original.category)}>
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'donationHistory.totalDonated',
      header: 'Total Donated',
      cell: ({ row }) => {
        const donationHistory = row.original.donationHistory || {};
        const totalDonated = donationHistory.totalDonated || 0;
        const donationCount = donationHistory.donationCount || 0;
        
        return (
          <div className="text-right">
            <div className="font-medium">
              {formatCurrency(totalDonated)}
            </div>
            <div className="text-sm text-muted-foreground">
              {donationCount} donations
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'donationHistory.lastDonation',
      header: 'Last Donation',
      cell: ({ row }) => {
        const donationHistory = row.original.donationHistory || {};
        const lastDonation = donationHistory.lastDonation;
        return lastDonation ? (
          <div className="text-sm">
            {new Date(lastDonation).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-muted-foreground">Never</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'active';
        return (
          <Badge className={getStatusColor(status)}>
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const donor = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(donor)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {hasPermission('donors.update') && (
                <DropdownMenuItem onClick={() => onEdit(donor)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => window.open(`mailto:${donor.email}`)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`tel:${donor.phone}`)}>
                <Phone className="mr-2 h-4 w-4" />
                Call
              </DropdownMenuItem>
              {hasPermission('donors.update') && (
                <>
                  {donor.status === 'active' ? (
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(donor, 'inactive')}
                      className="text-orange-600"
                    >
                      Deactivate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(donor, 'active')}
                      className="text-green-600"
                    >
                      Activate
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {hasPermission('donors.delete') && (
                <DropdownMenuItem 
                  onClick={() => handleDelete(donor)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleFilterChange = (key: keyof DonorFilters, value: any) => {
    // Convert "all" back to empty string for API
    const filterValue = value === "all" ? "" : value;
    setFilters(prev => ({
      ...prev,
      [key]: filterValue,
      page: 1, // Reset to first page when filtering
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      status: '',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading donors: {error.message}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading donors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search donors..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select
          value={filters.type || "all"}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="foundation">Foundation</SelectItem>
            <SelectItem value="trust">Trust</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.category || "all"}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="patron">Patron</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="recurring">Recurring</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="pending_verification">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={clearFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Clear
        </Button>

        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.items || data?.data?.items || data?.donors || []}
        loading={isLoading}
        pagination={{
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: data?.pagination?.total || data?.data?.pagination?.total || data?.total || 0,
          onPageChange: (page) => handleFilterChange('page', page),
          onLimitChange: (limit) => handleFilterChange('limit', limit),
        }}
      />
    </div>
  );
};