import { Button } from './ui/button';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel,
} from './ui/alert-dialog';

const ConfirmWindow = ({ topic, name, selectedDate, selectedTime, endingTime, regularBooking, setShowConfirmWindow, newBookingHandler, regularBookingLength, regularBookingTimeformat, submitting }) => {
  const details = [
    ['Aihe', topic],
    ['Nimi', name],
    ['Päivä', selectedDate.toLocaleDateString('fi-FI')],
    ['Aika', `${selectedTime[0]}–${endingTime}`],
    ...(regularBooking ? [['Toistuvuus', `${regularBookingLength} ${regularBookingTimeformat}`]] : []),
  ];

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open && !submitting) setShowConfirmWindow(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vahvista varaus</AlertDialogTitle>
          <AlertDialogDescription>Tarkista tiedot ennen tallennusta.</AlertDialogDescription>
        </AlertDialogHeader>
        <dl className="mt-5 divide-y rounded-lg border bg-muted/30 px-4">
          {details.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 py-3 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <AlertDialogFooter>
          <AlertDialogCancel asChild><Button type="button" variant="outline" disabled={submitting}>Peruuta</Button></AlertDialogCancel>
          <Button type="button" disabled={submitting} onClick={() => { void newBookingHandler(); }}>{submitting ? 'Tallennetaan…' : 'Vahvista varaus'}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmWindow;
