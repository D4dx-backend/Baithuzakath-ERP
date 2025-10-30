import { useState } from "react";
import { History, Calendar, DollarSign, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDonations } from "@/hooks/useDonations";

export default function DonationHistory() {
  const [filters, setFilters] = useState({
    search: '',
    method: 'all',
    purpose: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10,
  });

  // Use proper donations hook
  const { data: donationHistory, isLoading } = useDonations(filters);

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
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for API
    const filterValue = value === "all" ? "" : value;
    setFilters(prev => ({
      ...prev,
      [key]: filterValue,
      page: 1, // Reset to first page when filtering
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Donation History</h1>
          <p className="text-muted-foreground mt-1">
            Complete history of all donations (anonymous and identified)
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export History
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Input
                placeholder="Search donations..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <Select
              value={filters.method || "all"}
              onValueChange={(value) => handleFilterChange('method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.purpose || "all"}
              onValueChange={(value) => handleFilterChange('purpose', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purposes</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="scheme">Scheme</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setFilters({
              search: '',
              method: 'all',
              purpose: 'all',
              dateFrom: '',
              dateTo: '',
              page: 1,
              limit: 10,
            })}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Donation History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading donation history...</p>
            </div>
          ) : donationHistory?.data?.items?.length || donationHistory?.items?.length ? (
            <div className="space-y-4">
              {(donationHistory?.data?.items || donationHistory?.items || []).map((donation) => (
                <div key={donation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-full">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {donation.donor?.name || 'Anonymous Donor'}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </span>
                          <span>Method: {donation.method}</span>
                          <span>Purpose: {donation.purpose}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(donation.amount)}
                      </p>
                      <Badge className={getStatusColor(donation.status)}>
                        {donation.status}
                      </Badge>
                    </div>
                  </div>
                  {donation.receiptNumber && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Receipt: {donation.receiptNumber}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No donation history found</h3>
              <p className="text-muted-foreground">
                No donations match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}