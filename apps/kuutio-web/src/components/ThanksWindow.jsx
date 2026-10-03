import { CircleCheck } from 'lucide-react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription } from './ui/alert-dialog';

const ThanksWindow = ({ setNewBooking, setShowThanksWindow }) => {
  const close = () => { setNewBooking(false); setShowThanksWindow(false); };
  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) close(); }}>
      <AlertDialogContent>
        <CircleCheck aria-hidden="true" className="mb-4 size-10 text-primary" />
        <AlertDialogHeader>
          <AlertDialogTitle>Varaus vahvistettu</AlertDialogTitle>
          <AlertDialogDescription>Kuutio on varattu sinulle. Varaus näkyy valitun päivän listassa.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter><Button type="button" onClick={close}>Valmis</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ThanksWindow;
