import { useQuery } from '@tanstack/react-query';
import { api, endpoints } from '../lib/api';
import type { Departure } from '../types';

export function useDepartures(start?: Date, end?: Date) {
    return useQuery({
        queryKey: ['departures', start?.toISOString(), end?.toISOString()],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (start) params.append('start', start.toISOString());
            if (end) params.append('end', end.toISOString());

            const { data } = await api.get<Departure[]>(endpoints.admin.departures, { params });
            return data;
        },
    });
}
