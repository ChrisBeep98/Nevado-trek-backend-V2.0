import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '../services/bookings.service';
import { useToast } from '../context/ToastContext';

export function useBookings(departureId?: string) {
  return useQuery({
    queryKey: ['bookings', departureId],
    queryFn: async () => {
      if (departureId) {
        const { data } = await bookingsService.getByDeparture(departureId);
        return data;
      }
      const { data } = await bookingsService.getAll();
      return data;
    }
  });
}

export function useBookingMutations() {
  const queryClient = useQueryClient();
  const { success } = useToast();

  const createBooking = useMutation({
    mutationFn: bookingsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['departures'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      success('Booking created successfully');
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['departures'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    }
  });

  const updatePax = useMutation({
    mutationFn: ({ id, pax }: { id: string; pax: number }) =>
      bookingsService.updatePax(id, pax),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['departures'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    }
  });

  const updateDetails = useMutation({
    mutationFn: ({ id, customer }: { id: string; customer: any }) =>
      bookingsService.updateDetails(id, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    }
  });

  const applyDiscount = useMutation({
    mutationFn: ({ id, discountAmount, newFinalPrice, reason }: {
      id: string;
      discountAmount?: number;
      newFinalPrice?: number;
      reason: string
    }) => bookingsService.applyDiscount(id, { discountAmount, newFinalPrice, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    }
  });

  const moveBooking = useMutation({
    mutationFn: ({ id, newTourId, newDate }: { id: string; newTourId: string; newDate: string }) =>
      bookingsService.move(id, newTourId, newDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['departures'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    }
  });

  const convertType = useMutation({
    mutationFn: ({ id, targetType }: { id: string; targetType: 'public' | 'private' }) =>
      bookingsService.convertType(id, targetType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['departures'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    }
  });

  return {
    createBooking,
    updateStatus,
    updatePax,
    updateDetails,
    applyDiscount,
    moveBooking,
    convertType
  };
}
