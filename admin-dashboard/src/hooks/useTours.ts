import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toursService } from '../services/tours.service';
import { useToast } from '../context/ToastContext';
import type { Tour } from '../types';

export function useTours() {
    const queryClient = useQueryClient();
    const { success, error } = useToast();

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
            success('Tour created successfully');
        },
        onError: (err: any) => {
            error(err?.response?.data?.error || 'Failed to create tour');
        }
    });

    const updateTourMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Tour> }) =>
            toursService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            success('Tour updated successfully');
        },
        onError: (err: any) => {
            error(err?.response?.data?.error || 'Failed to update tour');
        }
    });

    const deleteTourMutation = useMutation({
        mutationFn: toursService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            success('Tour deactivated successfully');
        },
        onError: (err: any) => {
            error(err?.response?.data?.error || 'Failed to deactivate tour');
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
