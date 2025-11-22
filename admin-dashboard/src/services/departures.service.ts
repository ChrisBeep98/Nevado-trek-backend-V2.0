import { api, endpoints } from '../lib/api';

export const departuresService = {
    getCalendar: (start: string, end: string) =>
        api.get(endpoints.admin.departures, { params: { start, end } }),
    create: (data: { tourId: string; date: string; type: 'public' | 'private'; maxPax?: number }) =>
        api.post(endpoints.admin.departures, data),
    update: (id: string, data: { date?: string; maxPax?: number; tourId?: string }) =>
        api.put(endpoints.admin.departure(id), data),
    split: (id: string, bookingId: string) =>
        api.post(endpoints.admin.splitDeparture(id), { bookingId }),
    delete: (id: string) => api.delete(endpoints.admin.departure(id)),
};
