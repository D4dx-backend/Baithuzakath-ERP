import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { users as usersApi, type User } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";

interface DeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onDelete?: () => void;
}

export function DeleteUserModal({ open, onOpenChange, user, onDelete }: DeleteUserModalProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    try {
      setDeleting(true);
      
      const response = await usersApi.delete(user.id);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        
        onDelete?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete User
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. This will permanently delete the user account and remove all associated data.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm">
              Are you sure you want to delete the following user?
            </p>
            
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
              <p className="text-sm text-muted-foreground capitalize">
                Role: {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}