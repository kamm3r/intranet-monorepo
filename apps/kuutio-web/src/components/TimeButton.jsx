import { initTimes } from '../features/functions';
import { sameCalendarDay, selectTime } from '../features/booking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const slots = initTimes().map(({ time }) => time);

const TimeButton = ({ bookings, selectedDate, selectedTime, setSelectedTime, setNewBooking, disabledAll = false }) => {
  const booked = new Set(bookings
    .filter((booking) => sameCalendarDay(booking.selectedDate, selectedDate))
    .flatMap((booking) => booking.selectedTime));
  const now = new Date();
  const today = sameCalendarDay(selectedDate, now);
  const first = slots.indexOf(selectedTime[0]);
  const last = slots.indexOf(selectedTime[selectedTime.length - 1]);

  const choose = (time) => {
    const next = selectTime(selectedTime, time, slots);
    setSelectedTime(next);
    setNewBooking(next.length > 0);
  };

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="font-display text-xl">Vapaat ajat</CardTitle>
        <CardDescription>Valitse enintään neljä peräkkäistä puolen tunnin aikaa.</CardDescription>
      </CardHeader>
      <CardContent>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {slots.map((time, index) => {
          const selected = selectedTime.includes(time);
          const [hour, minute] = time.split(':').map(Number);
          const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, minute);
          const unavailable = disabledAll || booked.has(time) || (today && start <= now);
          const adjacent = selectedTime.length === 0 ||
            (selectedTime.length < 4 && (index === first - 1 || index === last + 1));
          const disabled = unavailable || (!selected && !adjacent);
          return (
            <Button
              type="button"
              variant={selected ? 'default' : 'outline'}
              key={time}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => choose(time)}
              className={`h-10 min-w-0 px-1 text-sm font-medium disabled:cursor-not-allowed ${disabled ? 'border-border bg-muted/50 text-muted-foreground/65' : 'hover:border-primary'}`}
            >
              {time}
            </Button>
          );
        })}
      </div>
      </CardContent>
    </Card>
  );
};

export default TimeButton;
