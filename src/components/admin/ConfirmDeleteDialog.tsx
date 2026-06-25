import { useState, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfirmDeleteDialogProps {
  trigger: ReactNode;
  title: ReactNode;
  description: ReactNode;
  /** Word the user must type to enable the confirm button. Defaults to "Delete". */
  confirmWord?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

/**
 * A destructive-action confirmation dialog that requires the admin to type a
 * specific word (default: "Delete") before the confirm button is enabled.
 * This guards sensitive bulk deletes against accidental clicks.
 */
export function ConfirmDeleteDialog({
  trigger,
  title,
  description,
  confirmWord = "Delete",
  confirmLabel = "Yes, Delete",
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === confirmWord.toLowerCase();

  const reset = () => setTyped("");

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-delete-input" className="text-sm">
            Type <span className="font-semibold">{confirmWord}</span> to confirm
          </Label>
          <Input
            id="confirm-delete-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmWord}
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!matches}
            onClick={() => {
              onConfirm();
              reset();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDeleteDialog;