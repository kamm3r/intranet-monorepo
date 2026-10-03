import { recurrenceAvailability } from '../features/booking';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const frequencies = [
  { value: 'weekly', label: 'viikkoa' },
  { value: 'weekdays', label: 'arkipäivää' },
];

const RegularBooking = ({ selectedDate, selectedTime, bookings, length, frequency, onRegularLengthChange, onFrequencyChange }) => {
  const { limit, collision } = recurrenceAvailability(bookings, selectedDate, selectedTime, frequency);

  return (
    <div className="space-y-4 rounded-lg border bg-muted/35 p-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Toistuvuus</legend>
        <RadioGroup value={frequency || ''} onValueChange={(value) => { onFrequencyChange(value); onRegularLengthChange(1); }} className="flex flex-wrap gap-4">
          {frequencies.map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem id={`regular-time-${value}`} value={value} />
              <Label htmlFor={`regular-time-${value}`} className="cursor-pointer leading-5">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="regular-len">Varausten määrä</Label>
        <Input
          type="number"
          id="regular-len"
          min="1"
          max={limit}
          disabled={!frequency}
          className="w-24"
          value={length}
          onChange={(event) => onRegularLengthChange(Math.max(1, Math.min(Number(event.target.value) || 1, limit)))}
        />
      </div>
      {frequency && <p className="text-sm text-muted-foreground">Varattavissa: {limit} {frequency === 'weekly' ? 'viikkoa' : 'arkipäivää'}</p>}
      {collision && <Alert variant="destructive"><AlertDescription>Päällekkäinen varaus: {collision}</AlertDescription></Alert>}
    </div>
  );
};

export default RegularBooking;
