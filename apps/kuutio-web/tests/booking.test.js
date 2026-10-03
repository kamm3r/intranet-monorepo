import test from 'node:test';
import assert from 'node:assert/strict';
import { nextRecurringDate, recurrenceAvailability, selectTime } from '../src/features/booking.js';

const slots = ['08:00', '08:30', '09:00', '09:30', '10:00'];

test('time selection stays contiguous and is limited to two hours', () => {
  assert.deepEqual(selectTime([], '08:30', slots), ['08:30']);
  assert.deepEqual(selectTime(['08:30'], '09:30', slots), ['08:30']);
  assert.deepEqual(selectTime(['08:30'], '09:00', slots), ['08:30', '09:00']);
  assert.deepEqual(selectTime(['08:00', '08:30', '09:00', '09:30'], '10:00', slots), ['08:00', '08:30', '09:00', '09:30']);
  assert.deepEqual(selectTime(['08:00', '08:30', '09:00'], '08:30', slots), []);
});

test('weekday repeats skip the weekend and stop before a conflicting booking', () => {
  const friday = new Date(2026, 9, 2);
  const monday = nextRecurringDate(friday, 'weekdays');
  assert.equal(monday.getDay(), 1);
  assert.equal(monday.getDate(), 5);
  const availability = recurrenceAvailability([
    { selectedDate: monday, selectedTime: ['08:30'] },
  ], friday, ['08:30', '09:00'], 'weekdays');
  assert.equal(availability.limit, 1);
  assert.match(availability.collision, /08:30/);
});

test('weekly repeats advance seven days and allow dates before a conflict', () => {
  const start = new Date(2026, 9, 2);
  const conflict = new Date(2026, 9, 16);
  assert.equal(nextRecurringDate(start, 'weekly').getDate(), 9);
  assert.equal(recurrenceAvailability([
    { selectedDate: conflict, selectedTime: ['09:00'] },
  ], start, ['09:00'], 'weekly').limit, 2);
});
