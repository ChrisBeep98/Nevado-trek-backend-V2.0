import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toursService } from '../services/tours.service';
import type { Tour } from '../types';

export function useTours() {
    const queryClient = useQueryClient();

    const toursQuery = useQuery({
        queryKey: ['tours'],
        queryFn: async () => {
            const { data } = await toursService.getAll();
            return data;
        }
    });

    const createTourMutation = useMutation({
        mutationFn: toursService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
        }
    });

    const updateTourMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Tour> }) =>
            toursService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
        }
    });

    const deleteTourMutation = useMutation({
        mutationFn: toursService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
        }
    });

    return {
        ...toursQuery,
        createTour: createTourMutation.mutate,
        updateTour: updateTourMutation.mutate,
        deleteTour: deleteTourMutation.mutate,
        isCreating: createTourMutation.isPending,
        isUpdating: updateTourMutation.isPending,
        isDeleting: deleteTourMutation.isPending
    };
}

export function useTour(id?: string) {
    return useQuery({
        queryKey: ['tour', id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await toursService.getById(id);
            return data;
        },
        enabled: !!id
    });
}
