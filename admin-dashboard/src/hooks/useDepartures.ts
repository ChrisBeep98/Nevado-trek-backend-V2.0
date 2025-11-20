import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departuresService } from '../services/departures.service';

export function useDepartures(start?: string, end?: string) {
    return useQuery({
        queryKey: ['departures', start, end],
        queryFn: async () => {
            if (!start || !end) return [];
            const { data } = await departuresService.getCalendar(start, end);
            return data;
        },
        enabled: !!start && !!end
    });
}

export function useDepartureMutations() {
    const queryClient = useQueryClient();

    const createDeparture = useMutation({
        mutationFn: departuresService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departures'] });
        }
    });

    const updateDeparture = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            departuresService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departures'] });
        }
    });

    const splitDeparture = useMutation({
        mutationFn: ({ id, bookingId }: { id: string; bookingId: string }) =>
            departuresService.split(id, bookingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departures'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        }
    });

    const deleteDeparture = useMutation({
        mutationFn: departuresService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departures'] });
        }
    });

    return {
        createDeparture,
        updateDeparture,
        splitDeparture,
        deleteDeparture
    };
}
