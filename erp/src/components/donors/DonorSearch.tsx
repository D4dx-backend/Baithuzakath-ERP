import { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, Plus, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSearchDonors } from '@/hooks/useDonors';
import { Donor } from '@/types/donor';
import { DonationModal } from '@/components/modals/DonationModal';

interface DonorSearchProps {
  onDonorSelect?: (donor: Donor) => void;
  onCreateNew?: () => void;
  skipAnonymousChoice?: boolean; // New prop to skip anonymous choice
}

export function DonorSearch({ onDonorSelect, onCreateNew, skipAnonymousChoice = false }: DonorSearchProps) {
  const [step, setStep] = useState<'anonymous' | 'search' | 'donation'>(skipAnonymousChoice ? 'search' : 'anonymous');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  
  const { data: searchResults, isLoading, error } = useSearchDonors(searchQuery, 10);

  const handleDonorSelect = (donor: Donor) => {
    setSelectedDonor(donor);
    setShowDonationModal(true);
    onDonorSelect?.(donor);
  };

  const handleAnonymousChoice = (anonymous: boolean) => {
    setIsAnonymous(anonymous);
    if (anonymous) {
      // For anonymous donations, go directly to donation modal
      setSelectedDonor(null);
      setShowDonationModal(true);
    } else {
      // For non-anonymous, go to search step
      setStep('search');
    }
  };

  const handleCreateNewDonor = () => {
    onCreateNew?.();
    setStep('anonymous'); // Reset to start
  };

  const resetFlow = () => {
    setStep('anonymous');
    setIsAnonymous(false);
    setSearchQuery('');
    setSelectedDonor(null);
    setShowDonationModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Anonymous Giving Choice */}
      {step === 'anonymous' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Record Donation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Is this an anonymous donation?
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleAnonymousChoice(true)}
                className="w-full justify-start bg-gradient-primary"
                size="lg"
              >
                <Gift className="mr-2 h-4 w-4" />
                Yes, Anonymous Donation
              </Button>
              
              <Button 
                onClick={() => handleAnonymousChoice(false)}
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <User className="mr-2 h-4 w-4" />
                No, Record Donor Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Search for Existing Donor */}
      {step === 'search' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Find Existing Donor</h3>
            {!skipAnonymousChoice && (
              <Button variant="outline" size="sm" onClick={resetFlow}>
                Back to Start
              </Button>
            )}
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </>
      )}

      {/* Search Results */}
      {step === 'search' && searchQuery.length >= 2 && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-600">Error: {error.message}</p>
            </div>
          ) : (searchResults?.data?.donors?.length || searchResults?.donors?.length) ? (
            <>
              <p className="text-sm text-muted-foreground">
                Found {(searchResults?.data?.donors || searchResults?.donors || []).length} donor(s)
              </p>
              {(searchResults?.data?.donors || searchResults?.donors || []).map((donor) => (
                <Card key={donor.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{donor.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {donor.phone}
                            </div>
                            {donor.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {donor.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {formatCurrency(donor.totalDonated)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total donated
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(donor.status || 'active')}>
                          {(donor.status || 'active').replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {donor.type || 'individual'}
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleDonorSelect(donor)}
                        className="bg-gradient-primary"
                      >
                        Record Donation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No donors found</h3>
                <p className="text-muted-foreground mb-4">
                  No donors match your search criteria. Would you like to add a new donor?
                </p>
                <Button onClick={handleCreateNewDonor} className="bg-gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Donor
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No search query */}
      {step === 'search' && searchQuery.length < 2 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Search for Donors</h3>
            <p className="text-muted-foreground mb-4">
              Enter at least 2 characters to search for existing donors by name, phone, or email.
            </p>
            <Button onClick={handleCreateNewDonor} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New Donor Instead
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Donation Modal */}
      <DonationModal
        open={showDonationModal}
        onOpenChange={(open) => {
          setShowDonationModal(open);
          if (!open) {
            resetFlow(); // Reset the flow when modal closes
          }
        }}
        donor={selectedDonor ? {
          id: selectedDonor.id,
          name: selectedDonor.name,
          phone: selectedDonor.phone,
          email: selectedDonor.email,
        } : null}
        isAnonymous={isAnonymous}
      />
    </div>
  );
}