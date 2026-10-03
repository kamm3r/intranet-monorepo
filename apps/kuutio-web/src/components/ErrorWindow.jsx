import { CircleAlert } from 'lucide-react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription } from './ui/alert-dialog';

const ErrorWindow = ({ setNewBooking, setShowErrorWindow, setShowConfirmWindow, message }) => {
  const close = () => { setNewBooking(false); setShowErrorWindow(false); setShowConfirmWindow(false); };
  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) close(); }}>
      <AlertDialogContent>
        <CircleAlert aria-hidden="true" className="mb-4 size-10 text-destructive" />
        <AlertDialogHeader>
          <AlertDialogTitle>Varausta ei voitu tallentaa</AlertDialogTitle>
          <AlertDialogDescription>{message || 'Tarkista toistuvuus ja valitse vapaa aika uudelleen.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter><Button type="button" onClick={close}>Valitse uusi aika</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ErrorWindow;
