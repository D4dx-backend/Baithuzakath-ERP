import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award,
  UserPlus,
  Repeat,
  Target,
  Calendar
} from 'lucide-react';
import { useDonorStats, useDonorTrends } from '@/hooks/useDonors';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description 
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <Icon className="h-8 w-8 text-muted-foreground" />
          {trend && (
            <Badge 
              variant={trend.isPositive ? "default" : "destructive"}
              className="mt-2 text-xs"
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DonorStats: React.FC = () => {
  const { data: statsData, isLoading: statsLoading } = useDonorStats();
  const { data: trendsData, isLoading: trendsLoading } = useDonorTrends(6);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  if (statsLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statsData?.data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load donor statistics</p>
      </div>
    );
  }

  const stats = statsData.data;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Donors"
          value={stats.overview.totalDonors.toLocaleString()}
          icon={Users}
          trend={{ value: 15, isPositive: true }}
          description="All registered donors"
        />
        
        <StatsCard
          title="Active Donors"
          value={stats.overview.activeDonors.toLocaleString()}
          icon={UserPlus}
          trend={{ value: 8, isPositive: true }}
          description="Donors with recent activity"
        />
        
        <StatsCard
          title="Total Donations"
          value={formatCurrency(stats.overview.totalDonationsAmount)}
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
          description={`${stats.overview.totalDonationsCount} donations`}
        />
        
        <StatsCard
          title="Average Donation"
          value={formatCurrency(stats.overview.averageDonation)}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
          description="Per donation amount"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="New This Month"
          value={stats.overview.newDonorsThisMonth.toLocaleString()}
          icon={Calendar}
          description="New donor registrations"
        />
        
        <StatsCard
          title="Recurring Donors"
          value={stats.overview.recurringDonors.toLocaleString()}
          icon={Repeat}
          description="Regular contributors"
        />
        
        <StatsCard
          title="Patron Donors"
          value={stats.overview.patronDonors.toLocaleString()}
          icon={Award}
          description="High-value donors"
        />
        
        <StatsCard
          title="Retention Rate"
          value="87%"
          icon={Target}
          trend={{ value: 3, isPositive: true }}
          description="Donor retention"
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* By Type */}
        <Card>
          <CardHeader>
            <CardTitle>Donors by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.byType.map((item) => (
              <div key={item.type} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{item.type}</span>
                  <span className="font-medium">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Total: {formatCurrency(item.totalAmount)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle>Donors by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.byCategory.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{item.category}</span>
                  <span className="font-medium">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Total: {formatCurrency(item.totalAmount)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.byMethod.map((item) => (
              <div key={item.method} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{item.method.replace('_', ' ')}</span>
                  <span className="font-medium">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Total: {formatCurrency(item.totalAmount)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Donors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Donors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topDonors.slice(0, 5).map((donor, index) => (
              <div key={donor.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{donor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {donor.donationCount} donations
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(donor.totalDonated)}</p>
                  <p className="text-xs text-muted-foreground">
                    Last: {new Date(donor.lastDonation).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      {!trendsLoading && trendsData?.data && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.monthlyTrends.slice(-6).map((trend) => (
                <div key={trend.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{trend.month}</span>
                    <div className="text-right">
                      <span className="font-medium">
                        {formatCurrency(trend.donationAmount)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({trend.donorCount} donors)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Progress 
                        value={(trend.donationAmount / Math.max(...stats.monthlyTrends.map(t => t.donationAmount))) * 100} 
                        className="h-2" 
                      />
                    </div>
                    {trend.newDonors > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{trend.newDonors} new
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};