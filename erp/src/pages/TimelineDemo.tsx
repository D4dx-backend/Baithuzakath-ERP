import { useState } from "react";
import { DistributionTimelineAccordion } from "@/components/timeline";
import { TimelineConfigModal } from "@/components/modals/TimelineConfigModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Clock, 
  Settings, 
  Eye, 
  Edit, 
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// Mock scheme data for demonstration
const mockScheme = {
  id: "1",
  name: "Housing Support Scheme",
  distributionTimeline: [
    {
      description: "Initial Payment (First Installment)",
      percentage: 50,
      daysFromApproval: 7,
      requiresVerification: true,
      notes: "First installment after approval verification"
    },
    {
      description: "Progress Payment (Second Installment)",
      percentage: 30,
      daysFromApproval: 60,
      requiresVerification: true,
      notes: "Payment after progress verification and milestone completion"
    },
    {
      description: "Final Payment (Completion)",
      percentage: 20,
      daysFromApproval: 120,
      requiresVerification: true,
      notes: "Final payment upon project completion and final verification"
    }
  ]
};

// Sample timeline data with different statuses
const sampleTimelines = {
  pending: [
    {
      description: "Initial Payment (First Installment)",
      percentage: 50,
      daysFromApproval: 7,
      requiresVerification: true,
      notes: "First installment after approval verification",
      status: 'pending' as const
    },
    {
      description: "Progress Payment (Second Installment)",
      percentage: 30,
      daysFromApproval: 60,
      requiresVerification: true,
      notes: "Payment after progress verification",
      status: 'pending' as const
    },
    {
      description: "Final Payment (Completion)",
      percentage: 20,
      daysFromApproval: 120,
      requiresVerification: true,
      notes: "Final payment upon completion",
      status: 'pending' as const
    }
  ],
  
  inProgress: [
    {
      description: "Initial Payment (First Installment)",
      percentage: 50,
      daysFromApproval: 7,
      requiresVerification: true,
      notes: "First installment after approval verification",
      status: 'completed' as const,
      completedDate: new Date('2024-01-15')
    },
    {
      description: "Progress Payment (Second Installment)",
      percentage: 30,
      daysFromApproval: 60,
      requiresVerification: true,
      notes: "Payment after progress verification",
      status: 'in-progress' as const
    },
    {
      description: "Final Payment (Completion)",
      percentage: 20,
      daysFromApproval: 120,
      requiresVerification: true,
      notes: "Final payment upon completion",
      status: 'pending' as const
    }
  ],

  completed: [
    {
      description: "Initial Payment (First Installment)",
      percentage: 50,
      daysFromApproval: 7,
      requiresVerification: true,
      notes: "First installment after approval verification",
      status: 'completed' as const,
      completedDate: new Date('2024-01-15')
    },
    {
      description: "Progress Payment (Second Installment)",
      percentage: 30,
      daysFromApproval: 60,
      requiresVerification: true,
      notes: "Payment after progress verification",
      status: 'completed' as const,
      completedDate: new Date('2024-03-01')
    },
    {
      description: "Final Payment (Completion)",
      percentage: 20,
      daysFromApproval: 120,
      requiresVerification: true,
      notes: "Final payment upon completion",
      status: 'completed' as const,
      completedDate: new Date('2024-04-15')
    }
  ]
};

export default function TimelineDemo() {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<keyof typeof sampleTimelines>('pending');

  const handleEdit = (stepIndex: number) => {
    toast({
      title: "Edit Step",
      description: `Opening edit dialog for step ${stepIndex + 1}`,
    });
  };

  const handleView = (stepIndex: number) => {
    toast({
      title: "View Details",
      description: `Viewing detailed information for step ${stepIndex + 1}`,
    });
  };

  const handleConfigSuccess = () => {
    toast({
      title: "Configuration Updated",
      description: "Distribution timeline configuration has been updated successfully.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Distribution Timeline Accordion</h1>
            <p className="text-muted-foreground mt-2">
              Interactive accordion component for managing and displaying money distribution timelines
            </p>
          </div>
          <Button onClick={() => setConfigModalOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Timeline
          </Button>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Timeline Tracking</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Track payment phases with due dates and completion status
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Status Management</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Visual status indicators for pending, in-progress, and completed steps
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Amount Calculation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Automatic calculation of payment amounts based on percentages
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Edit className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Interactive Actions</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Edit, view, and manage individual timeline steps
            </p>
          </Card>
        </div>
      </div>

      {/* Demo Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Interactive Demo Scenarios
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Explore different timeline states and interactions
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedScenario} onValueChange={(value) => setSelectedScenario(value as keyof typeof sampleTimelines)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Pending Timeline
              </TabsTrigger>
              <TabsTrigger value="inProgress" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                In Progress
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="pending" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    All Steps Pending
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Timeline just created, no payments processed yet
                  </span>
                </div>
                <DistributionTimelineAccordion
                  timeline={sampleTimelines.pending}
                  approvalDate={new Date()}
                  totalAmount={50000}
                  editable={true}
                  onEdit={handleEdit}
                  onView={handleView}
                />
              </TabsContent>

              <TabsContent value="inProgress" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Partially Completed
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    First payment completed, second payment in progress
                  </span>
                </div>
                <DistributionTimelineAccordion
                  timeline={sampleTimelines.inProgress}
                  approvalDate={new Date('2024-01-01')}
                  totalAmount={75000}
                  editable={true}
                  onEdit={handleEdit}
                  onView={handleView}
                />
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Fully Completed
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    All payments processed and timeline completed
                  </span>
                </div>
                <DistributionTimelineAccordion
                  timeline={sampleTimelines.completed}
                  approvalDate={new Date('2024-01-01')}
                  totalAmount={100000}
                  editable={false}
                  onView={handleView}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Read-Only Mode</CardTitle>
            <p className="text-sm text-muted-foreground">
              Timeline display without edit capabilities
            </p>
          </CardHeader>
          <CardContent>
            <DistributionTimelineAccordion
              timeline={sampleTimelines.pending.slice(0, 2)}
              approvalDate={new Date()}
              totalAmount={25000}
              editable={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Without Amount Display</CardTitle>
            <p className="text-sm text-muted-foreground">
              Timeline showing only percentages
            </p>
          </CardHeader>
          <CardContent>
            <DistributionTimelineAccordion
              timeline={sampleTimelines.pending.slice(0, 2)}
              approvalDate={new Date()}
              editable={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* Configuration Modal */}
      <TimelineConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        scheme={mockScheme}
        onSuccess={handleConfigSuccess}
      />
    </div>
  );
}