import { api, endpoints } from '../lib/api';
import type { Tour } from '../types';

export const toursService = {
    getAll: () => api.get<Tour[]>(endpoints.admin.tours),
    getById: (id: string) => api.get<Tour>(endpoints.admin.tour(id)),
    create: (data: Partial<Tour>) => api.post<Tour>(endpoints.admin.tours, data),
    update: (id: string, data: Partial<Tour>) => api.put<Tour>(endpoints.admin.tour(id), data),
    delete: (id: string) => api.delete(endpoints.admin.tour(id)),
};
