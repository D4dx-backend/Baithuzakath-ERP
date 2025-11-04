import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  User, 
  Search, 
  Eye, 
  Calendar,
  Activity,
  RefreshCw,
  Download,
  Filter,
  TrendingUp
} from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/use-toast';
import { activityLogService } from '@/services/activityLogService';
import { users } from '@/lib/api';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActivity?: string;
  totalActivities?: number;
  recentActivities?: any[];
}

interface UserActivitySummary {
  dailyActivity: Array<{
    _id: string;
    count: number;
    actions: string[];
    resources: string[];
  }>;
  totalActivity: number;
  period: string;
}

const UserActivity: React.FC = () => {
  const { hasPermission } = useRBAC();
  const { toast } = useToast();
  
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userSummary, setUserSummary] = useState<UserActivitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState(30);

  const canViewLogs = hasPermission('activity_logs.read');

  useEffect(() => {
    if (canViewLogs) {
      fetchUsers();
    }
  }, [canViewLogs]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await users.getAll({ limit: 100 });
      
      if (response.success) {
        // Fetch activity count for each user
        const usersWithActivity = await Promise.all(
          response.data.users.map(async (user) => {
            try {
              const activityResponse = await activityLogService.getActivityLogs({
                userId: user.id,
                limit: 1
              });
              
              return {
                ...user,
                totalActivities: activityResponse.data?.pagination?.total || 0,
                lastActivity: activityResponse.data?.logs?.[0]?.timestamp
              };
            } catch (error) {
              return {
                ...user,
                totalActivities: 0,
                lastActivity: undefined
              };
            }
          })
        );
        
        setUsersList(usersWithActivity);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSummary = async (userId: string) => {
    try {
      const response = await activityLogService.getUserActivitySummary(userId, summaryPeriod);
      
      if (response.success) {
        setUserSummary(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user activity summary',
        variant: 'destructive'
      });
    }
  };

  const handleUserSelect = async (user: UserData) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    await fetchUserSummary(user.id);
  };

  const exportUserActivity = async (userId: string) => {
    try {
      await activityLogService.exportLogs({ 
        userId, 
        format: 'csv' 
      });
      
      toast({
        title: 'Success',
        description: 'User activity exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export user activity',
        variant: 'destructive'
      });
    }
  };

  const filteredUsers = usersList.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const uniqueRoles = [...new Set(usersList.map(user => user.role))];

  if (!canViewLogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view user activity.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Activity</h1>
          <p className="text-gray-600">Monitor individual user activities and patterns</p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Total Activities</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-gray-500">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        No users found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-gray-400" />
                          {user.totalActivities?.toLocaleString() || 0}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {user.lastActivity ? (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <div className="text-sm">
                                {format(new Date(user.lastActivity), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(user.lastActivity), 'HH:mm')}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No activity</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog open={showUserDetails && selectedUser?.id === user.id} onOpenChange={setShowUserDetails}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUserSelect(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  User Activity Details - {selectedUser?.name}
                                </DialogTitle>
                              </DialogHeader>
                              
                              {selectedUser && (
                                <div className="space-y-6">
                                  {/* User Info */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Name
                                      </label>
                                      <p className="text-sm text-gray-900">{selectedUser.name}</p>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Role
                                      </label>
                                      <Badge variant="outline">
                                        {selectedUser.role.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Period Selector */}
                                  <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700">
                                      Analysis Period:
                                    </label>
                                    <Select 
                                      value={summaryPeriod.toString()} 
                                      onValueChange={(value) => {
                                        setSummaryPeriod(parseInt(value));
                                        if (selectedUser) {
                                          fetchUserSummary(selectedUser.id);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="7">7 Days</SelectItem>
                                        <SelectItem value="30">30 Days</SelectItem>
                                        <SelectItem value="90">90 Days</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Activity Summary */}
                                  {userSummary && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card>
                                          <CardContent className="pt-6">
                                            <div className="text-2xl font-bold">{userSummary.totalActivity}</div>
                                            <p className="text-xs text-muted-foreground">
                                              Total Activities ({userSummary.period})
                                            </p>
                                          </CardContent>
                                        </Card>
                                        
                                        <Card>
                                          <CardContent className="pt-6">
                                            <div className="text-2xl font-bold">
                                              {userSummary.dailyActivity.length}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              Active Days
                                            </p>
                                          </CardContent>
                                        </Card>
                                        
                                        <Card>
                                          <CardContent className="pt-6">
                                            <div className="text-2xl font-bold">
                                              {userSummary.totalActivity > 0 
                                                ? Math.round(userSummary.totalActivity / userSummary.dailyActivity.length)
                                                : 0}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              Avg. Daily Activities
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </div>

                                      {/* Activity Chart */}
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center">
                                            <TrendingUp className="h-4 w-4 mr-2" />
                                            Daily Activity Trend
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <ResponsiveContainer width="100%" height={200}>
                                            <LineChart data={userSummary.dailyActivity}>
                                              <CartesianGrid strokeDasharray="3 3" />
                                              <XAxis dataKey="_id" />
                                              <YAxis />
                                              <Tooltip />
                                              <Line 
                                                type="monotone" 
                                                dataKey="count" 
                                                stroke="#8884d8" 
                                                strokeWidth={2}
                                              />
                                            </LineChart>
                                          </ResponsiveContainer>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  )}

                                  {/* Export Button */}
                                  <div className="flex justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => exportUserActivity(selectedUser.id)}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Export User Activity
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportUserActivity(user.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivity;