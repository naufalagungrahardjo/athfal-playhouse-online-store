
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export const DeleteAccountButton = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Only show for user role
  if (!user || user.role !== "user") return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Delete from public.users via RLS (user can delete own account)
      const { error: dbError } = await supabase.from("users").delete().eq("id", user.id);
      if (dbError) throw dbError;

      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      });

      // 3. Sign out and redirect
      logout();
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete account",
        description: error.message || "An error occurred while deleting your account.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full mt-4" disabled={loading}>
          {loading ? "Deleting..." : "Delete Account"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be removed permanently.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleDelete}
          >
            Yes, delete my account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountButton;
