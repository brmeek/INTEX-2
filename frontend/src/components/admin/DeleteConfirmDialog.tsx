import * as React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  pending?: boolean;
}

/**
 * In-app delete confirmation — matches admin card styling and sits centered in the viewport
 * (avoids native window.confirm placement).
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  pending = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          "top-[52%] max-w-md gap-5 border-border bg-white p-6 shadow-card sm:rounded-xl",
          "font-body"
        )}
      >
        <AlertDialogHeader className="space-y-3 text-left">
          <AlertDialogTitle className="font-heading text-xl font-bold leading-snug text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left font-body text-sm leading-relaxed text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:space-x-2">
          <AlertDialogCancel className="font-body" disabled={pending} type="button">
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="font-body"
            disabled={pending}
            onClick={() => void onConfirm()}
          >
            {pending ? "Deleting…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
