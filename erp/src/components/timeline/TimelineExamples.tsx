import { useState } from "react";
import { DistributionTimelineAccordion } from "./DistributionTimelineAccordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

// Example timeline data
const sampleTimelines = {
  basic: [
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
  ],
  
  withStatus: [
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
      notes: "Payment after progress verification and milestone completion",
      status: 'in-progress' as const
    },
    {
      description: "Final Payment (Completion)",
      percentage: 20,
      daysFromApproval: 120,
      requiresVerification: true,
      notes: "Final payment upon project completion and final verification",
      status: 'pending' as const
    }
  ],

  complex: [
    {
      description: "Emergency Relief Fund",
      percentage: 25,
      daysFromApproval: 1,
      requiresVerification: false,
      notes: "Immediate emergency assistance - no verification required"
    },
    {
      description: "Housing Support Payment",
      percentage: 35,
      daysFromApproval: 14,
      requiresVerification: true,
      notes: "Housing assistance after property verification"
    },
    {
      description: "Education Support Fund",
      percentage: 20,
      daysFromApproval: 30,
      requiresVerification: true,
      notes: "Educational expenses after enrollment verification"
    },
    {
      description: "Healthcare Support",
      percentage: 15,
      daysFromApproval: 45,
      requiresVerification: true,
      notes: "Medical expenses support with healthcare provider verification"
    },
    {
      description: "Final Settlement",
      percentage: 5,
      daysFromApproval: 90,
      requiresVerification: true,
      notes: "Final settlement after all requirements are met"
    }
  ]
};

export function TimelineExamples() {
  const [selectedTimeline, setSelectedTimeline] = useState<keyof typeof sampleTimelines>('basic');
  
  const handleEdit = (stepIndex: number) => {
    toast({
      title: "Edit Step",
      description: `Editing step ${stepIndex + 1}: ${sampleTimelines[selectedTimeline][stepIndex].description}`,
    });
  };

  const handleView = (stepIndex: number) => {
    toast({
      title: "View Details",
      description: `Viewing details for step ${stepIndex + 1}: ${sampleTimelines[selectedTimeline][stepIndex].description}`,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Distribution Timeline Accordion Examples</h1>
        <p className="text-muted-foreground">
          Interactive examples showing different configurations of the Distribution Timeline Accordion component.
        </p>
      </div>

      <Tabs value={selectedTimeline} onValueChange={(value) => setSelectedTimeline(value as keyof typeof sampleTimelines)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Timeline</TabsTrigger>
          <TabsTrigger value="withStatus">With Status</TabsTrigger>
          <TabsTrigger value="complex">Complex Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Distribution Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                A simple 3-step distribution timeline with standard percentages and verification requirements.
              </p>
            </CardHeader>
            <CardContent>
              <DistributionTimelineAccordion
                timeline={sampleTimelines.basic}
                approvalDate={new Date('2024-01-01')}
                totalAmount={10000}
                editable={true}
                onEdit={handleEdit}
                onView={handleView}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withStatus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline with Status Tracking</CardTitle>
              <p className="text-sm text-muted-foreground">
                Timeline showing different status states: completed, in-progress, and pending steps.
              </p>
            </CardHeader>
            <CardContent>
              <DistributionTimelineAccordion
                timeline={sampleTimelines.withStatus}
                approvalDate={new Date('2024-01-01')}
                totalAmount={15000}
                editable={true}
                onEdit={handleEdit}
                onView={handleView}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complex" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complex Multi-Step Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                A comprehensive 5-step timeline with varied verification requirements and different payment purposes.
              </p>
            </CardHeader>
            <CardContent>
              <DistributionTimelineAccordion
                timeline={sampleTimelines.complex}
                approvalDate={new Date('2024-02-01')}
                totalAmount={25000}
                editable={true}
                onEdit={handleEdit}
                onView={handleView}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Read-Only Timeline (No Actions)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Example of a timeline in read-only mode without edit capabilities.
          </p>
        </CardHeader>
        <CardContent>
          <DistributionTimelineAccordion
            timeline={sampleTimelines.basic}
            approvalDate={new Date('2024-01-01')}
            totalAmount={8000}
            editable={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline Without Amounts</CardTitle>
          <p className="text-sm text-muted-foreground">
            Timeline showing only percentages without total amount calculations.
          </p>
        </CardHeader>
        <CardContent>
          <DistributionTimelineAccordion
            timeline={sampleTimelines.basic}
            approvalDate={new Date('2024-01-01')}
            editable={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}