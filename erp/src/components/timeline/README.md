# Distribution Timeline Accordion Components

This directory contains accordion components for managing and displaying money distribution timelines in the ERP system.

## Components

### 1. DistributionTimelineAccordion

A comprehensive accordion component for displaying distribution timeline steps with interactive features.

#### Features

- **Timeline Overview**: Shows total steps, completed steps, and overall progress
- **Step-by-Step Display**: Each timeline step in an expandable accordion item
- **Status Tracking**: Visual indicators for pending, in-progress, completed, and overdue steps
- **Amount Calculations**: Automatic calculation of payment amounts based on percentages
- **Interactive Actions**: Edit and view actions for individual steps
- **Responsive Design**: Works well on desktop and mobile devices

#### Props

```typescript
interface DistributionTimelineAccordionProps {
  timeline: DistributionStep[];           // Array of timeline steps
  approvalDate?: Date;                    // Date when timeline was approved
  totalAmount?: number;                   // Total amount to be distributed
  editable?: boolean;                     // Whether edit actions are available
  onEdit?: (stepIndex: number) => void;   // Callback for edit action
  onView?: (stepIndex: number) => void;   // Callback for view action
  className?: string;                     // Additional CSS classes
}
```

#### DistributionStep Interface

```typescript
interface DistributionStep {
  description: string;                    // Step description
  percentage: number;                     // Percentage of total amount
  daysFromApproval: number;              // Days from approval date
  requiresVerification: boolean;          // Whether verification is required
  notes?: string;                        // Optional notes
  status?: 'pending' | 'completed' | 'in-progress' | 'overdue';
  completedDate?: Date;                  // Date when step was completed
  amount?: number;                       // Calculated amount (optional)
}
```

#### Usage Examples

```tsx
import { DistributionTimelineAccordion } from '@/components/timeline';

// Basic usage
<DistributionTimelineAccordion
  timeline={timelineSteps}
  approvalDate={new Date('2024-01-01')}
  totalAmount={50000}
/>

// With edit capabilities
<DistributionTimelineAccordion
  timeline={timelineSteps}
  approvalDate={approvalDate}
  totalAmount={totalAmount}
  editable={true}
  onEdit={(stepIndex) => handleEdit(stepIndex)}
  onView={(stepIndex) => handleView(stepIndex)}
/>

// Read-only mode
<DistributionTimelineAccordion
  timeline={timelineSteps}
  approvalDate={approvalDate}
  editable={false}
/>
```

### 2. TimelineConfigModal (Enhanced)

The existing TimelineConfigModal has been enhanced with accordion functionality to better organize the configuration interface.

#### New Features

- **Timeline Overview Section**: Shows total percentage allocation and timeline summary
- **Distribution Steps Section**: Accordion-based step configuration
- **Nested Accordions**: Each step has its own accordion for detailed configuration
- **Visual Summary**: Quick overview of all steps with key information

#### Usage

```tsx
import { TimelineConfigModal } from '@/components/modals/TimelineConfigModal';

<TimelineConfigModal
  open={isOpen}
  onOpenChange={setIsOpen}
  scheme={selectedScheme}
  onSuccess={handleSuccess}
/>
```

### 3. TimelineExamples

A comprehensive example component showing different configurations and use cases.

#### Features

- **Multiple Scenarios**: Basic, with status, and complex timelines
- **Interactive Tabs**: Switch between different example configurations
- **Read-only Examples**: Demonstrations of non-editable timelines
- **Various Configurations**: With and without amounts, different statuses

## Demo Page

The `TimelineDemo.tsx` page provides a complete demonstration of all components with:

- Interactive scenarios (pending, in-progress, completed)
- Feature overview cards
- Usage examples
- Configuration modal integration

To view the demo, navigate to `/timeline-demo` in your application.

## Status Indicators

The accordion uses color-coded badges to indicate step status:

- **Pending** (Gray): Step not yet started
- **In Progress** (Blue): Step currently being processed
- **Completed** (Green): Step successfully completed
- **Overdue** (Red): Step past due date

## Responsive Design

All components are designed to work well on different screen sizes:

- **Desktop**: Full grid layout with all information visible
- **Tablet**: Responsive grid that adapts to medium screens
- **Mobile**: Stacked layout with collapsible sections

## Integration

### In Application View Modal

```tsx
// Replace existing timeline display with accordion
<DistributionTimelineAccordion
  timeline={application.distributionTimeline}
  approvalDate={application.approvalDate}
  totalAmount={application.approvedAmount}
  editable={canEdit}
  onEdit={handleEditStep}
  onView={handleViewStep}
/>
```

### In Payment Management

```tsx
// Show payment timeline with status tracking
<DistributionTimelineAccordion
  timeline={paymentSchedule.distributionTimeline}
  approvalDate={paymentSchedule.approvalDate}
  totalAmount={paymentSchedule.totalAmount}
  editable={false}
  onView={handleViewPaymentDetails}
/>
```

## Customization

### Styling

The components use Tailwind CSS classes and can be customized by:

1. Passing additional classes via `className` prop
2. Modifying the component's internal styles
3. Using CSS custom properties for theme colors

### Status Logic

The status calculation logic can be customized by modifying the `getStepStatus` function in the `DistributionTimelineAccordion` component.

### Icons

Icons are from Lucide React and can be replaced by modifying the import statements and icon references.

## Dependencies

- React 18+
- Radix UI Accordion
- Lucide React (icons)
- date-fns (date formatting)
- Tailwind CSS (styling)
- ShadCN UI components

## Best Practices

1. **Always provide approval date** when timeline has started
2. **Use status tracking** for active timelines
3. **Include total amount** when displaying payment information
4. **Provide edit callbacks** only when user has permission
5. **Add meaningful notes** to help users understand each step
6. **Validate percentages** to ensure they don't exceed 100%

## Accessibility

- Keyboard navigation support through Radix UI Accordion
- Screen reader friendly with proper ARIA labels
- High contrast colors for status indicators
- Focus management for interactive elements