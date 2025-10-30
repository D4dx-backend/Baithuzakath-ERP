import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, Shield, Users, UserCheck, UserX, Loader2, AlertCircle, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserModal } from "@/components/modals/UserModal";
import { DeleteUserModal } from "@/components/modals/DeleteUserModal";
import { users as usersApi, type User } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";

// Role color mapping
const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 border-red-200",
  state_admin: "bg-purple-100 text-purple-800 border-purple-200",
  district_admin: "bg-blue-100 text-blue-800 border-blue-200",
  area_admin: "bg-green-100 text-green-800 border-green-200",
  unit_admin: "bg-yellow-100 text-yellow-800 border-yellow-200",
  project_coordinator: "bg-orange-100 text-orange-800 border-orange-200",
  scheme_coordinator: "bg-pink-100 text-pink-800 border-pink-200",
  beneficiary: "bg-gray-100 text-gray-800 border-gray-200",
};

// Role display names
const roleNames: Record<string, string> = {
  super_admin: "Super Admin",
  state_admin: "State Admin",
  district_admin: "District Admin",
  area_admin: "Area Admin",
  unit_admin: "Unit Admin",
  project_coordinator: "Project Coordinator",
  scheme_coordinator: "Scheme Coordinator",
  beneficiary: "Beneficiary",
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { hasAnyPermission, hasPermission } = useRBAC();
  
  // Permission checks
  const canViewUsers = hasAnyPermission(['users.read.all', 'users.read.regional']);
  const canCreateUsers = hasPermission('users.create');
  const canUpdateUsers = hasAnyPermission(['users.update.all', 'users.update.regional']);
  const canDeleteUsers = hasPermission('users.delete');
  
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Access denied check
  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view user management.
          </p>
        </div>
      </div>
    );
  }

  // Load users and stats on component mount
  useEffect(() => {
    loadUsers();
    loadStats();
  }, [currentPage, selectedRole, selectedStatus, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (selectedRole !== "all") params.role = selectedRole;
      // Only filter by status if explicitly selected (not "all")
      if (selectedStatus === "active") {
        params.isActive = true;
      } else if (selectedStatus === "inactive") {
        params.isActive = false;
      }
      // If selectedStatus is "all", don't add isActive filter at all
      
      if (searchTerm) params.search = searchTerm;

      const response = await usersApi.getAll(params);
      
      if (response.success && response.data) {
        setUserList(response.data.users);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await usersApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load user stats:', err);
    }
  };



  // Modal handlers
  const handleAddUser = () => {
    setSelectedUser(undefined);
    setModalMode("create");
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalMode("edit");
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleModalSave = () => {
    loadUsers();
    loadStats();
  };

  // Check if current user can manage a specific user
  const canManageUser = (targetUser: User) => {
    if (!currentUser) return false;
    
    // Super admin and state admin can manage everyone except themselves
    if (currentUser.role === 'super_admin' || currentUser.role === 'state_admin') {
      return currentUser.id !== targetUser.id;
    }
    
    // Role hierarchy check
    const roleHierarchy: Record<string, string[]> = {
      district_admin: ['area_admin', 'unit_admin', 'beneficiary'],
      area_admin: ['unit_admin', 'beneficiary'],
      unit_admin: ['beneficiary']
    };
    
    const managableRoles = roleHierarchy[currentUser.role] || [];
    return managableRoles.includes(targetUser.role);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      <UserModal
        open={showUserModal}
        onOpenChange={setShowUserModal}
        user={selectedUser}
        mode={modalMode}
        onSave={handleModalSave}
      />
      
      <DeleteUserModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        user={selectedUser}
        onDelete={handleModalSave}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system users and permissions</p>
        </div>
        <Button className="bg-gradient-primary shadow-glow" onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.overview.activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.overview.verifiedUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.overview.totalUsers - stats.overview.activeUsers}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="state_admin">State Admin</SelectItem>
                <SelectItem value="district_admin">District Admin</SelectItem>
                <SelectItem value="area_admin">Area Admin</SelectItem>
                <SelectItem value="unit_admin">Unit Admin</SelectItem>
                <SelectItem value="project_coordinator">Project Coordinator</SelectItem>
                <SelectItem value="scheme_coordinator">Scheme Coordinator</SelectItem>
                <SelectItem value="beneficiary">Beneficiary</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({userList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : userList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profile?.avatar} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email || user.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role] || roleColors.beneficiary}>
                          {roleNames[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{user.phone}</p>
                          {user.adminScope?.regions && user.adminScope.regions.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {user.adminScope.regions.length} region(s)
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {user.isVerified && (
                            <Shield className="h-4 w-4 text-green-600" title="Verified" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(user.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            
                            {canManageUser(user) && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}