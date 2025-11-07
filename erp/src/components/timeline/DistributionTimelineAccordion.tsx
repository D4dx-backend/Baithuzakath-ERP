import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Calendar, 
  Percent, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Edit,
  Eye
} from "lucide-react";
import { format, addDays } from "date-fns";

interface DistributionStep {
  description: string;
  percentage: number;
  daysFromApproval: number;
  requiresVerification: boolean;
  notes?: string;
  status?: 'pending' | 'completed' | 'in-progress' | 'overdue';
  completedDate?: Date;
  amount?: number;
}

interface DistributionTimelineAccordionProps {
  timeline: DistributionStep[];
  approvalDate?: Date;
  totalAmount?: number;
  editable?: boolean;
  onEdit?: (stepIndex: number) => void;
  onView?: (stepIndex: number) => void;
  className?: string;
}

export function DistributionTimelineAccordion({
  timeline,
  approvalDate,
  totalAmount,
  editable = false,
  onEdit,
  onView,
  className = ""
}: DistributionTimelineAccordionProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const getStepStatus = (step: DistributionStep, index: number): 'pending' | 'completed' | 'in-progress' | 'overdue' => {
    if (step.status) return step.status;
    
    if (!approvalDate) return 'pending';
    
    const dueDate = addDays(approvalDate, step.daysFromApproval);
    const now = new Date();
    
    if (step.completedDate) return 'completed';
    if (now > dueDate) return 'overdue';
    if (index === 0 || timeline[index - 1]?.status === 'completed') return 'in-progress';
    
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const calculateAmount = (percentage: number) => {
    return totalAmount ? (totalAmount * percentage) / 100 : 0;
  };

  const totalPercentage = timeline.reduce((sum, step) => sum + step.percentage, 0);
  const completedSteps = timeline.filter(step => getStepStatus(step, timeline.indexOf(step)) === 'completed').length;
  const progressPercentage = timeline.length > 0 ? (completedSteps / timeline.length) * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Timeline Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Distribution Timeline Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{timeline.length}</div>
              <div className="text-sm text-muted-foreground">Total Steps</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedSteps}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalPercentage}%</div>
              <div className="text-sm text-muted-foreground">Total Allocation</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Timeline Steps */}
      <Accordion 
        type="multiple" 
        value={expandedItems} 
        onValueChange={setExpandedItems}
        className="space-y-2"
      >
        {timeline.map((step, index) => {
          const status = getStepStatus(step, index);
          const dueDate = approvalDate ? addDays(approvalDate, step.daysFromApproval) : null;
          const amount = calculateAmount(step.percentage);

          return (
            <AccordionItem 
              key={index} 
              value={`step-${index}`}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{step.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {step.percentage}% • Day {step.daysFromApproval}
                        {totalAmount && ` • $${amount.toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(status)}>
                      {getStatusIcon(status)}
                      <span className="ml-1 capitalize">{status}</span>
                    </Badge>
                    {step.requiresVerification && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verification Required
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Percent className="h-4 w-4" />
                          Payment Details
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Percentage:</span>
                            <span className="font-medium">{step.percentage}%</span>
                          </div>
                          {totalAmount && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="font-medium">${amount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Days from Approval:</span>
                            <span className="font-medium">{step.daysFromApproval} days</span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          Timeline Details
                        </div>
                        <div className="space-y-1 text-sm">
                          {dueDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Due Date:</span>
                              <span className="font-medium">{format(dueDate, 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                          {step.completedDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Completed:</span>
                              <span className="font-medium text-green-600">
                                {format(step.completedDate, 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Verification:</span>
                            <span className="font-medium">
                              {step.requiresVerification ? 'Required' : 'Not Required'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {step.notes && (
                    <Card className="p-3">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Notes</div>
                        <div className="text-sm text-muted-foreground">{step.notes}</div>
                      </div>
                    </Card>
                  )}

                  {(editable || onView) && (
                    <div className="flex gap-2 pt-2 border-t">
                      {onView && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(index)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      )}
                      {editable && onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(index)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Step
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {timeline.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Distribution Timeline</h3>
            <p className="text-sm">No distribution steps have been configured yet.</p>
          </div>
        </Card>
      )}
    </div>
  );
}