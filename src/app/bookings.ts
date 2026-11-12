// src/app/bookings.ts
// Customers write `bookings`; tailors read the same docs as their jobs.
export type BookingStatus = 'pending' | 'in_progress' | 'completed';

export interface Booking {
  id: string;
  service: string;
  client: string;
  amount: number;
  status: BookingStatus;
  progress: number;
  deadline: string;
  measurements: string;
  notes: string;
}

// Live bookings exist in two shapes: newer docs use service/price/customerName,
// older ones use description/amount/customer.
export const toBooking = (id: string, d: any): Booking => ({
  id,
  service: d.service || d.description || d.serviceType || 'Booking request',
  client: d.customerName || d.customer || 'Customer',
  amount: Number(d.price ?? d.amount) || 0,
  status: d.status === 'completed' ? 'completed' : d.status === 'in_progress' || d.status === 'confirmed' ? 'in_progress' : 'pending',
  progress: Number(d.progress) || 0,
  deadline: d.deadline?.toDate ? d.deadline.toDate().toLocaleDateString() : d.deadline || '',
  measurements: d.measurements || '',
  notes: d.notes || '',
});
