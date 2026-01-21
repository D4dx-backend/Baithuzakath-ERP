import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title = "No Data Available",
  description = "There is no data to display at this time.",
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <Card className={cn("p-12", className)}>
      <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
        {Icon && (
          <div className="rounded-full bg-muted p-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {children || (
          <>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground max-w-md">
                  {description}
                </p>
              )}
            </div>
            {action && (
              <Button onClick={action.onClick} variant="default">
                {action.label}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
