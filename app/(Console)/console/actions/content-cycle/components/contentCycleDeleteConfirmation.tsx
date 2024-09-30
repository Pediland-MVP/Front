import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
  
  interface DeleteConfirmationDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    itemId: string
  }
  
  export function DeleteConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    itemId
  }: DeleteConfirmationDialogProps) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="rtl:text-right ltr:text-left">
          <AlertDialogHeader>
            <AlertDialogTitle>آیا از حذف این مورد اطمینان دارید؟</AlertDialogTitle>
            <AlertDialogDescription>
              این عمل غیرقابل بازگشت است. این مورد به طور دائمی از سرورهای ما حذف خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="rtl:flex-row-reverse">
            <AlertDialogAction onClick={onConfirm}>حذف</AlertDialogAction>
            <AlertDialogCancel onClick={onClose}>لغو</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }