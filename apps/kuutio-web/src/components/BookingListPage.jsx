import React, { useState } from "react";
import bookingApi from "../api/booking";
import Alert from './Alert';
import useStore from '../store';
import { Clock3 } from 'lucide-react';
import { Alert as Message, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

export const sortBookings = (filteredBookings) => {
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateComparison = new Date(a.selectedDate).getTime() - new Date(b.selectedDate).getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    } else {
      const timeA = a.selectedTime[0];
      const timeB = b.selectedTime[0];
      return timeA.localeCompare(timeB);
    }
  });
  return sortedBookings;
};

const BookingListPage = ({ onBookingsUpdate, selectedBookings }) => {
  const user = useStore((state) => state.user);
  const [error, setError] = useState('');

  const handleRemoveBooking = (id) => {
    bookingApi
      .remove(id)
      .then(() => {
        setError('');
        onBookingsUpdate((prevBookings) => prevBookings.filter((booking) => booking._id !== id));
      })
      .catch(() => {
        setError('Varausta ei voitu poistaa.');
      });
  };

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Päivän varaukset</h3>
        <Badge variant="secondary">{selectedBookings.length}</Badge>
      </div>
      {error && <Message variant="destructive"><AlertDescription>{error}</AlertDescription></Message>}
      {selectedBookings.length === 0 && <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">Ei varauksia tälle päivälle.</p>}
      <div className="space-y-3">
        {selectedBookings.map((booking) => (
          <div key={booking._id} className="min-w-0 rounded-lg border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="min-w-0 break-words font-semibold">{booking.topic}</h4>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary"><Clock3 className="size-4" aria-hidden="true" />{booking.selectedTime[0]}–{booking.endingTime}</span>
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground">{booking.name}</p>
            {(user?.admin || booking.createdBy === user?.email) && <div className="mt-2"><Alert onRemoveBooking={() => handleRemoveBooking(booking._id)} /></div>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default BookingListPage;
