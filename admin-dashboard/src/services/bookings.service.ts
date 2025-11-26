import { api, endpoints } from '../lib/api';
import type { Booking } from '../types';

export const bookingsService = {
    getAll: () => api.get<Booking[]>(endpoints.admin.bookings),
    getByDeparture: (departureId: string) =>
        api.get<Booking[]>(endpoints.admin.bookings, { params: { departureId } }),
    create: (data: any) => {
        // If departureId is provided, use join endpoint, otherwise use create endpoint
        if (data.departureId) {
            return api.post(endpoints.admin.joinBooking, data);
        }
        return api.post(endpoints.admin.bookings, data);
    },
    updateStatus: (id: string, status: string) =>
        api.put(endpoints.admin.bookingStatus(id), { status }),
    updatePax: (id: string, pax: number) =>
        api.put(endpoints.admin.bookingPax(id), { pax }),
    updateDetails: (id: string, customer: any) =>
        api.put(endpoints.admin.bookingDetails(id), { customer }),
    applyDiscount: (id: string, payload: { discountAmount?: number; newFinalPrice?: number; reason: string }) =>
        api.post(endpoints.admin.applyDiscount(id), payload),
    move: (id: string, newTourId: string, newDate: string) =>
        api.post(endpoints.admin.moveBooking(id), { newTourId, newDate }),
    convertType: (id: string, targetType: 'public' | 'private') =>
        api.post(endpoints.admin.convertBooking(id), { targetType }),
};
