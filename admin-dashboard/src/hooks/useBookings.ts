import { useQuery } from '@tanstack/react-query';
import { api, endpoints } from '../lib/api';
import type { Booking } from '../types';

export function useBookings(departureId?: string) {
  return useQuery({
    queryKey: ['bookings', departureId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departureId) params.append('departureId', departureId);

      const { data } = await api.get<Booking[]>(endpoints.admin.bookings, { params });
      return data;
    },
    enabled: !!departureId // Only fetch if departureId is provided (for now)
  });
}
