import { months, weekDays } from '../features/arrays';
import { sameCalendarDay } from '../features/booking';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';

const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

const Calendar = ({ date, setSelectedDate, highlightDays = [] }) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) => new Date(year, month, index - firstWeekday + 1));
  const canGoBack = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  const changeMonth = (offset) => {
    if (offset < 0 && !canGoBack) return;
    const first = new Date(year, month + offset, 1);
    setSelectedDate(first < today ? today : first);
  };

  return (
    <Card className="w-full min-w-0 gap-4 py-5">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl" aria-live="polite">{months[month]} {year}</h2>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon-sm" aria-label="Edellinen kuukausi" disabled={!canGoBack} onClick={() => changeMonth(-1)}><ChevronLeft aria-hidden="true" /></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDate(today)}>Tänään</Button>
            <Button type="button" variant="outline" size="icon-sm" aria-label="Seuraava kuukausi" onClick={() => changeMonth(1)}><ChevronRight aria-hidden="true" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-5">
        <div className="grid grid-cols-7 pb-1">
          {weekDays.map((day) => <span key={day} className="py-2 text-center text-xs font-medium text-muted-foreground sm:text-sm">{day}</span>)}
        </div>
        <div className="grid grid-cols-7">
        {days.map((day) => {
          const selectable = day >= today;
          const selected = sameCalendarDay(day, date);
          const highlighted = highlightDays.includes(day.getTime());
          const isToday = sameCalendarDay(day, today);
          const outside = day.getMonth() !== month;
          const circleClass = selected ? 'bg-primary text-primary-foreground' : highlighted ? 'bg-accent text-accent-foreground' : isToday ? 'border border-primary/40 text-primary' : '';
          return (
            <Button
              type="button"
              variant="ghost"
              key={dateKey(day)}
              data-date={dateKey(day)}
              aria-label={day.toLocaleDateString('fi-FI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              aria-pressed={selected}
              disabled={!selectable}
              onClick={() => setSelectedDate(day)}
              className={`h-11 min-w-0 px-0 text-sm font-normal hover:bg-accent/60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:opacity-40 sm:h-13 sm:text-base ${outside ? 'text-muted-foreground/65' : 'text-foreground'}`}
            >
              <span className={`flex size-9 items-center justify-center rounded-full sm:size-10 ${circleClass}`}>{day.getDate()}</span>
            </Button>
          );
        })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Calendar;
