import { Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from './ui/alert-dialog';

const Alert = ({ onRemoveBooking }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
        <Trash2 aria-hidden="true" className="size-4" /> Poista varaus
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Poistetaanko varaus?</AlertDialogTitle>
        <AlertDialogDescription>Varaus poistuu heti eikä sitä voi palauttaa.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel asChild><Button type="button" variant="outline">Peruuta</Button></AlertDialogCancel>
        <AlertDialogAction asChild><Button type="button" variant="destructive" onClick={onRemoveBooking}>Poista varaus</Button></AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default Alert;
