export const sameCalendarDay = (first, second) => {
  const a = new Date(first);
  const b = new Date(second);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export const selectTime = (selected, time, slots) => {
  const ordered = [...selected].sort();
  const index = ordered.indexOf(time);
  if (index !== -1) {
    // Removing a middle slot would leave a disconnected booking.
    if (index !== 0 && index !== ordered.length - 1) return [];
    return ordered.filter((slot) => slot !== time);
  }
  if (ordered.length >= 4) return ordered;
  const next = slots.indexOf(time);
  if (next < 0) return ordered;
  if (ordered.length > 0) {
    const first = slots.indexOf(ordered[0]);
    const last = slots.indexOf(ordered[ordered.length - 1]);
    if (next !== first - 1 && next !== last + 1) return ordered;
  }
  return [...ordered, time].sort();
};

export const nextRecurringDate = (date, frequency) => {
  const next = new Date(date);
  next.setDate(next.getDate() + (frequency === 'weekly' ? 7 : 1));
  if (frequency === 'weekdays') {
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
  }
  return next;
};

export const recurrenceAvailability = (bookings, startDate, times, frequency) => {
  if (!frequency || !times.length) return { limit: 1, collision: null };
  const maximum = frequency === 'weekly' ? 52 : 260;
  let date = new Date(startDate);
  for (let count = 1; count < maximum; count += 1) {
    date = nextRecurringDate(date, frequency);
    const conflict = bookings.find((booking) =>
      sameCalendarDay(booking.selectedDate, date) &&
      booking.selectedTime.some((time) => times.includes(time))
    );
    if (conflict) {
      const time = conflict.selectedTime.find((slot) => times.includes(slot));
      return { limit: count, collision: `${date.toLocaleDateString('fi-FI')} klo ${time}` };
    }
  }
  return { limit: maximum, collision: null };
};
