import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  User, 
  Calendar, 
  Eye, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';
import { activityLogService } from '@/services/activityLogService';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface ActivityLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  description: string;
  status: 'success' | 'failed' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface ActivityLogWidgetProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const ActivityLogWidget: React.FC<ActivityLogWidgetProps> = ({ 
  limit = 5, 
  showHeader = true,
  className = ""
}) => {
  const { hasPermission } = useRBAC();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canViewLogs = hasPermission('activity_logs.read');

  useEffect(() => {
    if (canViewLogs) {
      fetchRecentActivity();
    }
  }, [canViewLogs, limit]);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await activityLogService.getRecentActivity(limit);
      
      if (response.success) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <Info className="h-3 w-3 text-blue-500" />;
      default:
        return <Info className="h-3 w-3 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!canViewLogs) {
    return null; // Don't show widget if user doesn't have permission
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Recent Activity
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRecentActivity}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/activity-logs">
              <Button variant="ghost" size="sm">
                <Eye className="h-3 w-3 mr-1" />
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-4">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Activity className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">No recent activity</span>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log._id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(log.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {log.userId?.name || 'Unknown User'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                    </div>
                    
                    <Badge className={`text-xs ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {log.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {log.resource}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {log.userId?.role}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {logs.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Link to="/activity-logs">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-3 w-3 mr-2" />
                View All Activity Logs
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogWidget;