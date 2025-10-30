import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api } from '../../lib/api';
import { useToast } from '@/hooks/use-toast';

interface Location {
  _id: string;
  name: string;
  code: string;
  type: string;
  parent?: string;
}

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

interface BeneficiaryModalProps {
  beneficiary: Beneficiary | null;
  mode: 'create' | 'edit' | 'view';
  onClose: (shouldRefresh?: boolean) => void;
}

export const BeneficiaryModal: React.FC<BeneficiaryModalProps> = ({
  beneficiary,
  mode,
  onClose
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    state: '',
    district: '',
    area: '',
    unit: '',
    status: 'pending' as 'active' | 'inactive' | 'pending'
  });

  const [locations, setLocations] = useState<{
    states: Location[];
    districts: Location[];
    areas: Location[];
    units: Location[];
  }>({
    states: [],
    districts: [],
    areas: [],
    units: []
  });

  const [searchTerms, setSearchTerms] = useState({
    state: '',
    district: '',
    area: '',
    unit: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (beneficiary && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: beneficiary.name,
        phone: beneficiary.phone,
        state: beneficiary.state._id,
        district: beneficiary.district._id,
        area: beneficiary.area._id,
        unit: beneficiary.unit._id,
        status: beneficiary.status
      });
      
      setSearchTerms({
        state: beneficiary.state.name,
        district: beneficiary.district.name,
        area: beneficiary.area.name,
        unit: beneficiary.unit.name
      });
    }
    
    fetchStates();
  }, [beneficiary, mode]);

  useEffect(() => {
    if (formData.state) {
      fetchDistricts(formData.state);
    } else {
      setLocations(prev => ({ ...prev, districts: [], areas: [], units: [] }));
      setFormData(prev => ({ ...prev, district: '', area: '', unit: '' }));
    }
  }, [formData.state]);

  useEffect(() => {
    if (formData.district) {
      fetchAreas(formData.district);
    } else {
      setLocations(prev => ({ ...prev, areas: [], units: [] }));
      setFormData(prev => ({ ...prev, area: '', unit: '' }));
    }
  }, [formData.district]);

  useEffect(() => {
    if (formData.area) {
      fetchUnits(formData.area);
    } else {
      setLocations(prev => ({ ...prev, units: [] }));
      setFormData(prev => ({ ...prev, unit: '' }));
    }
  }, [formData.area]);

  const fetchStates = async () => {
    try {
      const response = await api.get('/locations?type=state&limit=100');
      setLocations(prev => ({ ...prev, states: response.data.locations }));
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchDistricts = async (stateId: string) => {
    try {
      const response = await api.get(`/locations?type=district&parent=${stateId}&limit=100`);
      setLocations(prev => ({ ...prev, districts: response.data.locations }));
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchAreas = async (districtId: string) => {
    try {
      const response = await api.get(`/locations?type=area&parent=${districtId}&limit=100`);
      setLocations(prev => ({ ...prev, areas: response.data.locations }));
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const fetchUnits = async (areaId: string) => {
    try {
      const response = await api.get(`/locations?type=unit&parent=${areaId}&limit=100`);
      setLocations(prev => ({ ...prev, units: response.data.locations }));
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationSelect = (type: string, locationId: string, locationName: string) => {
    setFormData(prev => ({ ...prev, [type]: locationId }));
    setSearchTerms(prev => ({ ...prev, [type]: locationName }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be a valid 10-digit Indian mobile number';
    }

    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.area) newErrors.area = 'Area is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'create') {
        await api.post('/beneficiaries', formData);
        toast({
          title: "Success",
          description: "Beneficiary created successfully"
        });
      } else if (mode === 'edit') {
        await api.put(`/beneficiaries/${beneficiary!._id}`, formData);
        toast({
          title: "Success",
          description: "Beneficiary updated successfully"
        });
      }
      onClose(true);
    } catch (error: any) {
      console.error('Error saving beneficiary:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save beneficiary",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLocationSelect = (
    type: 'state' | 'district' | 'area' | 'unit',
    label: string,
    options: Location[],
    disabled = false
  ) => {
    const filteredOptions = options.filter(option =>
      option.name.toLowerCase().includes(searchTerms[type].toLowerCase())
    );

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} *
        </label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerms[type]}
              onChange={(e) => setSearchTerms(prev => ({ ...prev, [type]: e.target.value }))}
              disabled={disabled || mode === 'view'}
              className="pl-10"
            />
          </div>
          {searchTerms[type] && filteredOptions.length > 0 && mode !== 'view' && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredOptions.map((option) => (
                <button
                  key={option._id}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  onClick={() => handleLocationSelect(type, option._id, option.name)}
                >
                  <div className="font-medium">{option.name}</div>
                  <div className="text-sm text-gray-500">{option.code}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {errors[type] && (
          <p className="mt-1 text-sm text-red-600">{errors[type]}</p>
        )}
      </div>
    );
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Add New Beneficiary';
      case 'edit': return 'Edit Beneficiary';
      case 'view': return 'View Beneficiary';
      default: return 'Beneficiary';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
          <button
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={mode === 'view'}
                  placeholder="Enter beneficiary name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={mode === 'view'}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderLocationSelect('state', 'State', locations.states)}
              {renderLocationSelect('district', 'District', locations.districts, !formData.state)}
              {renderLocationSelect('area', 'Area', locations.areas, !formData.district)}
              {renderLocationSelect('unit', 'Unit', locations.units, !formData.area)}
            </div>
          </div>

          {/* Status (only for edit mode) */}
          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          {/* View Mode Additional Info */}
          {mode === 'view' && beneficiary && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      beneficiary.status === 'active' ? 'bg-green-100 text-green-800' :
                      beneficiary.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {beneficiary.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verified
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md">
                    {beneficiary.isVerified ? 'Yes' : 'No'}
                    {beneficiary.isVerified && beneficiary.verifiedBy && (
                      <div className="text-sm text-gray-500">
                        by {beneficiary.verifiedBy.name}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Applications
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md">
                    {beneficiary.applications.length} applications
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md">
                    {new Date(beneficiary.createdAt).toLocaleDateString()}
                    <div className="text-sm text-gray-500">
                      by {beneficiary.createdBy.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {mode !== 'view' && (
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Create Beneficiary' : 'Update Beneficiary'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};