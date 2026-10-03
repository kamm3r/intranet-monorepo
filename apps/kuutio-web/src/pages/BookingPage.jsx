import { useEffect, useState } from 'react';
import { CalendarDays, ChartNoAxesCombined } from 'lucide-react';
import Calendar from '../components/Calendar';
import TimeButton from '../components/TimeButton';
import RegularBooking from '../components/RegularBooking';
import BookingListPage, { sortBookings } from '../components/BookingListPage';
import ConfirmWindow from '../components/ConfirmWindow';
import ThanksWindow from '../components/ThanksWindow';
import ErrorWindow from '../components/ErrorWindow';
import Statistics from '../components/Statistics';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { NativeSelect } from '../components/ui/native-select';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import bookingApi from '../api/booking';
import { bookingTopics } from '../features/arrays';
import { nextRecurringDate, recurrenceAvailability, sameCalendarDay } from '../features/booking';
import { getEndingTime } from '../components/TimeButtonFunctions';
import { portalWebUrl } from '../config';
import useStore from '../store';

const BookingPage = () => {
  const user = useStore((state) => state.user);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [newBooking, setNewBooking] = useState(false);
  const [topic, setTopic] = useState('');
  const [name, setName] = useState('');
  const [selectedTime, setSelectedTime] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [regularBooking, setRegularBooking] = useState(false);
  const [regularBookingLength, setRegularBookingLength] = useState(1);
  const [regularBookingFrequency, setRegularBookingFrequency] = useState(null);
  const [showConfirmWindow, setShowConfirmWindow] = useState(false);
  const [showThanksWindow, setShowThanksWindow] = useState(false);
  const [showErrorWindow, setShowErrorWindow] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sortedTimes = [...selectedTime].sort();
  const endingTime = sortedTimes.length ? getEndingTime(sortedTimes[sortedTimes.length - 1]) : null;
  const selectedBookings = sortBookings(bookings.filter((booking) => sameCalendarDay(booking.selectedDate, selectedDate)));
  const recurrence = recurrenceAvailability(bookings, selectedDate, sortedTimes, regularBookingFrequency);
  const canBook = Boolean(user && sortedTimes.length && name.trim() && topic &&
    (!regularBooking || (regularBookingFrequency && regularBookingLength >= 1 && regularBookingLength <= recurrence.limit)));
  const selectedDateLabel = selectedDate.toLocaleDateString('fi-FI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const clearDraft = () => {
    setNewBooking(false);
    setTopic('');
    setName('');
    setSelectedTime([]);
    setRegularBooking(false);
    setRegularBookingLength(1);
    setRegularBookingFrequency(null);
  };

  useEffect(() => {
    clearDraft();
  }, [selectedDate]);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }
    let active = true;
    setLoadingBookings(true);
    setLoadError('');
    bookingApi.getAll()
      .then(({ data }) => { if (active) setBookings(sortBookings(data.data)); })
      .catch(() => { if (active) setLoadError('Varauksia ei voitu ladata. Päivitä sivu ja yritä uudelleen.'); })
      .finally(() => { if (active) setLoadingBookings(false); });
    return () => { active = false; };
  }, [user]);

  const newBookingHandler = async () => {
    if (submitting || !canBook) return;
    let bookingDate = new Date(selectedDate);
    const created = [];
    setSubmitting(true);
    setBookingError('');
    try {
      const count = regularBooking ? regularBookingLength : 1;
      for (let index = 0; index < count; index += 1) {
        const response = await bookingApi.create({ topic, name: name.trim(), selectedDate: bookingDate, selectedTime: sortedTimes, endingTime });
        created.push(response.data);
        if (regularBooking) bookingDate = nextRecurringDate(bookingDate, regularBookingFrequency);
      }
      setBookings((previous) => sortBookings([...previous, ...created]));
      clearDraft();
      setShowConfirmWindow(false);
      setShowThanksWindow(true);
    } catch (error) {
      await Promise.allSettled(created.map((booking) => bookingApi.remove(booking._id)));
      try {
        const response = await bookingApi.getAll();
        setBookings(sortBookings(response.data.data));
      } catch { /* Keep the last known list while reporting the booking error. */ }
      setBookingError(error.message || 'Varaus epäonnistui.');
      clearDraft();
      setShowConfirmWindow(false);
      setShowErrorWindow(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 px-4 pb-12 pt-8 sm:px-6">
      <div className="mb-7 space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Varaa Kuutio</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Valitse päivä ja vapaa aika. Voit varata huoneen enintään kahdeksi tunniksi kerrallaan.</p>
      </div>

      {!user && <Alert className="mb-5"><AlertDescription>Kirjaudu sisään nähdäksesi vapaat ajat ja tehdäksesi varauksen.</AlertDescription></Alert>}
      {loadingBookings && <p role="status" className="mb-5 text-sm text-muted-foreground">Ladataan varauksia…</p>}
      {loadError && <Alert variant="destructive" className="mb-5"><AlertDescription>{loadError}</AlertDescription></Alert>}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,1fr)] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Calendar date={selectedDate} setSelectedDate={setSelectedDate} highlightDays={bookings.map((booking) => new Date(booking.selectedDate).getTime())} />
          <TimeButton bookings={bookings} selectedDate={selectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} setNewBooking={setNewBooking} disabledAll={!user || loadingBookings || !!loadError} />
        </div>

        <Card className="min-w-0">
          <CardHeader className="gap-2">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><CalendarDays className="size-5" aria-hidden="true" /></span>
              <div className="min-w-0">
                <CardTitle className="font-display text-xl">{newBooking ? 'Uusi varaus' : 'Valittu päivä'}</CardTitle>
                <CardDescription className="mt-1 capitalize">{selectedDateLabel}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-w-0">
            {newBooking ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-primary/20 bg-accent/55 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Valittu aika</p>
                  <p className="font-display text-xl font-semibold text-primary">{sortedTimes[0]}–{endingTime}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-name">Nimi</Label>
                  <Input id="booking-name" placeholder="Varaajan nimi" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-topic">Aihe</Label>
                  <NativeSelect id="booking-topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
                    <option value="">Valitse aihe</option>
                    {bookingTopics.map((item) => <option key={item} value={item}>{item}</option>)}
                  </NativeSelect>
                </div>
                <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 leading-5">
                  <Checkbox id="regular-booking-checkbox" checked={regularBooking} onCheckedChange={() => setRegularBooking((previous) => !previous)} />
                  Jatkuva varaus
                </Label>
                {regularBooking && <RegularBooking selectedDate={selectedDate} selectedTime={selectedTime} bookings={bookings} length={regularBookingLength} frequency={regularBookingFrequency} onRegularLengthChange={setRegularBookingLength} onFrequencyChange={setRegularBookingFrequency} />}
              </div>
            ) : <BookingListPage onBookingsUpdate={setBookings} selectedBookings={selectedBookings} />}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2 border-t pt-5">
            <Button type="button" disabled={!canBook} onClick={() => setShowConfirmWindow(true)}>Varaa Kuutio</Button>
            <Button type="button" variant="ghost" asChild><a href={portalWebUrl}>Palaa etusivulle</a></Button>
          </CardFooter>
        </Card>
      </div>

      <section className="mt-7 min-w-0 border-t pt-6">
        <Button type="button" variant="outline" aria-expanded={showStatistics} onClick={() => setShowStatistics((previous) => !previous)}>
          <ChartNoAxesCombined aria-hidden="true" className="size-4" />
          {showStatistics ? 'Piilota tilastot' : 'Näytä tilastot'}
        </Button>
        {showStatistics && <Statistics bookings={bookings} />}
      </section>

      {showConfirmWindow && <ConfirmWindow topic={topic} name={name} selectedDate={selectedDate} selectedTime={sortedTimes} endingTime={endingTime} regularBooking={regularBooking} regularBookingLength={regularBookingLength} regularBookingTimeformat={regularBookingFrequency === 'weekly' ? 'viikkoa' : 'arkipäivää'} submitting={submitting} setShowConfirmWindow={setShowConfirmWindow} newBookingHandler={newBookingHandler} />}
      {showThanksWindow && <ThanksWindow setNewBooking={setNewBooking} setShowThanksWindow={setShowThanksWindow} />}
      {showErrorWindow && <ErrorWindow message={bookingError} setNewBooking={setNewBooking} setShowErrorWindow={setShowErrorWindow} setShowConfirmWindow={setShowConfirmWindow} />}
    </main>
  );
};

export default BookingPage;
