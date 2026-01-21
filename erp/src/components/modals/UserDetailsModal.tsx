import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, Shield, MapPin, Calendar, CheckCircle2, XCircle, Building2, Users, Briefcase, FileText } from "lucide-react";
import { type User as UserType } from "@/lib/api";
import { roleNames, roleColors } from "@/pages/UserManagement";

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | undefined;
}

export function UserDetailsModal({ open, onOpenChange, user }: UserDetailsModalProps) {
  if (!user) return null;

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationName = (location: any): string => {
    if (!location) return '-';
    if (typeof location === 'object' && location !== null) {
      return location.name || location.districtName || location.areaName || location.unitName || '-';
    }
    return String(location);
  };

  const getDistrictName = () => {
    const district = user.adminScope?.district;
    return getLocationName(district);
  };

  const getAreaName = () => {
    const area = user.adminScope?.area;
    return getLocationName(area);
  };

  const getUnitName = () => {
    const unit = user.adminScope?.unit;
    return getLocationName(unit);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Header */}
          <div className="flex items-start gap-4 pb-4 border-b">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profile?.avatar} />
              <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <Badge variant="outline" className={roleColors[user.role] || roleColors.beneficiary}>
                  {roleNames[user.role] || user.role}
                </Badge>
                {user.isVerified && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="outline" className={user.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                  {user.isActive ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {user.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm font-medium mt-1">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <p className="text-sm font-medium mt-1">{user.phone || '-'}</p>
              </div>
              {user.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm font-medium mt-1">{user.email}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="mt-1">
                  <Badge variant="outline" className={roleColors[user.role] || roleColors.beneficiary}>
                    {roleNames[user.role] || user.role}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                <div className="mt-1">
                  <Badge variant="outline" className={user.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Verification Status</label>
                <div className="mt-1">
                  <Badge variant="outline" className={user.isVerified ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                    {user.isVerified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                <p className="text-sm font-medium mt-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Administrative Scope */}
          {user.adminScope && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Administrative Scope
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.adminScope.level && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Admin Level</label>
                    <p className="text-sm font-medium mt-1 capitalize">{user.adminScope.level}</p>
                  </div>
                )}
                {getDistrictName() !== '-' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">District</label>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {getDistrictName()}
                    </p>
                  </div>
                )}
                {getAreaName() !== '-' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Area</label>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {getAreaName()}
                    </p>
                  </div>
                )}
                {getUnitName() !== '-' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit</label>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {getUnitName()}
                    </p>
                  </div>
                )}
                {user.adminScope.regions && user.adminScope.regions.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Regions</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {user.adminScope.regions.map((region: any, index: number) => (
                        <Badge key={index} variant="outline">
                          {typeof region === 'object' && region !== null ? region.name : region}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {user.adminScope.projects && user.adminScope.projects.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      Projects
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {user.adminScope.projects.map((project: any, index: number) => (
                        <Badge key={index} variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                          {typeof project === 'object' && project !== null ? `${project.name} (${project.code})` : project}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {user.adminScope.schemes && user.adminScope.schemes.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Schemes
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {user.adminScope.schemes.map((scheme: any, index: number) => (
                        <Badge key={index} variant="outline" className="bg-pink-50 text-pink-800 border-pink-200">
                          {typeof scheme === 'object' && scheme !== null ? `${scheme.name} (${scheme.code})` : scheme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {user.adminScope.permissions && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Permissions</label>
                    <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(user.adminScope.permissions).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          {value ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Information */}
          {user.profile && Object.keys(user.profile).length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.profile.dateOfBirth && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="text-sm font-medium mt-1">
                        {new Date(user.profile.dateOfBirth).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {user.profile.gender && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gender</label>
                      <p className="text-sm font-medium mt-1 capitalize">{user.profile.gender}</p>
                    </div>
                  )}
                  {user.profile.address && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p className="text-sm font-medium mt-1">
                        {[
                          user.profile.address.street,
                          user.profile.address.area,
                          user.profile.address.district,
                          user.profile.address.state,
                          user.profile.address.pincode
                        ].filter(Boolean).join(', ') || '-'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
