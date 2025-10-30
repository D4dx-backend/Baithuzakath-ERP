import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Pagination } from '../components/ui/pagination';
import { BeneficiaryModal } from '../components/modals/BeneficiaryModal';
import { DeleteBeneficiaryModal } from '../components/modals/DeleteBeneficiaryModal';
import { api } from '../lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';

interface Beneficiary {
  _id: string;
  name: string;
  phone: string;
  state: { _id: string; name: string; code: string };
  district: { _id: string; name: string; code: string };
  area: { _id: string; name: string; code: string };
  unit: { _id: string; name: string; code: string };
  status: 'active' | 'inactive' | 'pending';
  isVerified: boolean;
  verifiedBy?: { name: string };
  verifiedAt?: string;
  createdBy: { name: string };
  createdAt: string;
  applications: string[];
}

interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

const Beneficiaries: React.FC = () => {
  const { toast } = useToast();
  const { hasAnyPermission, hasPermission } = useRBAC();
  
  // Permission checks
  const canViewBeneficiaries = hasAnyPermission(['beneficiaries.read.all', 'beneficiaries.read.regional', 'beneficiaries.read.own']);
  const canCreateBeneficiaries = hasPermission('beneficiaries.create');
  const canUpdateBeneficiaries = hasPermission('beneficiaries.update.regional');
  
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  
  // Filters and search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Access denied check
  if (!canViewBeneficiaries) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view beneficiaries.
          </p>
        </div>
      </div>
    );
  }
  
  // Modals
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  const fetchBeneficiaries = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await api.get(`/beneficiaries?${params}`);
      setBeneficiaries(response.data.beneficiaries);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch beneficiaries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBeneficiaries(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, statusFilter]);

  const handlePageChange = (page: number) => {
    fetchBeneficiaries(page);
  };

  const handleCreateBeneficiary = () => {
    setSelectedBeneficiary(null);
    setModalMode('create');
    setShowBeneficiaryModal(true);
  };

  const handleViewBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setModalMode('view');
    setShowBeneficiaryModal(true);
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setModalMode('edit');
    setShowBeneficiaryModal(true);
  };

  const handleDeleteBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowDeleteModal(true);
  };

  const handleVerifyBeneficiary = async (beneficiary: Beneficiary) => {
    try {
      await api.patch(`/beneficiaries/${beneficiary._id}/verify`);
      toast({
        title: "Success",
        description: "Beneficiary verified successfully"
      });
      fetchBeneficiaries(pagination.current);
    } catch (error) {
      console.error('Error verifying beneficiary:', error);
      toast({
        title: "Error",
        description: "Failed to verify beneficiary",
        variant: "destructive"
      });
    }
  };

  const handleBeneficiaryModalClose = (shouldRefresh?: boolean) => {
    setShowBeneficiaryModal(false);
    setSelectedBeneficiary(null);
    if (shouldRefresh) {
      fetchBeneficiaries(pagination.current);
    }
  };

  const handleDeleteModalClose = (shouldRefresh?: boolean) => {
    setShowDeleteModal(false);
    setSelectedBeneficiary(null);
    if (shouldRefresh) {
      fetchBeneficiaries(pagination.current);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getLocationPath = (beneficiary: Beneficiary) => {
    return `${beneficiary.state.name} > ${beneficiary.district.name} > ${beneficiary.area.name} > ${beneficiary.unit.name}`;
  };

  if (loading && beneficiaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beneficiaries</h1>
          <p className="text-gray-600">Manage beneficiary registrations and applications</p>
        </div>
        <Button onClick={handleCreateBeneficiary} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Beneficiary
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
          <div className="text-sm text-gray-600">Total Beneficiaries</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {beneficiaries.filter(b => b.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">
            {beneficiaries.filter(b => b.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">
            {beneficiaries.filter(b => b.isVerified).length}
          </div>
          <div className="text-sm text-gray-600">Verified</div>
        </div>
      </div>

      {/* Beneficiaries Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beneficiary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {beneficiaries.map((beneficiary) => (
                <tr key={beneficiary._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {beneficiary.name}
                        {beneficiary.isVerified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{beneficiary.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {getLocationPath(beneficiary)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusBadge(beneficiary.status)}>
                      {beneficiary.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {beneficiary.applications.length} applications
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(beneficiary.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      by {beneficiary.createdBy.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBeneficiary(beneficiary)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBeneficiary(beneficiary)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!beneficiary.isVerified && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerifyBeneficiary(beneficiary)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBeneficiary(beneficiary)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {beneficiaries.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">No beneficiaries found</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modals */}
      {showBeneficiaryModal && (
        <BeneficiaryModal
          beneficiary={selectedBeneficiary}
          mode={modalMode}
          onClose={handleBeneficiaryModalClose}
        />
      )}

      {showDeleteModal && selectedBeneficiary && (
        <DeleteBeneficiaryModal
          beneficiary={selectedBeneficiary}
          onClose={handleDeleteModalClose}
        />
      )}
    </div>
  );
};

export default Beneficiaries;