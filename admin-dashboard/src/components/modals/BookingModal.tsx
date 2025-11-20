import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api, endpoints } from '../../lib/api';
import { LiquidButton } from '../ui/LiquidButton';
import type { Booking } from '../../types';

const bookingSchema = z.object({
    customer: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        phone: z.string().min(1, 'Phone is required'),
        document: z.string().min(1, 'Document is required'),
        note: z.string().optional(),
    }),
    pax: z.number().min(1, 'Min 1 pax'),
    tourId: z.string().optional(),
    date: z.string().optional(),
    type: z.enum(['public', 'private']).optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId?: string;
    departureId?: string;
}

export function BookingModal({ isOpen, onClose, bookingId, departureId }: BookingModalProps) {
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            pax: 1,
            type: 'public'
        }
    });

    const { data: booking } = useQuery({
        queryKey: ['booking', bookingId],
        queryFn: async () => {
            if (!bookingId) return null;
            const { data } = await api.get<Booking>(endpoints.admin.booking(bookingId));
            return data;
        },
        enabled: !!bookingId
    });

    useEffect(() => {
        if (booking) {
            reset({
                customer: {
                    name: booking.customer.name,
                    email: booking.customer.email,
                    phone: booking.customer.phone,
                    document: booking.customer.document
                },
                pax: booking.pax,
                // Note: status and paymentStatus are not in the schema for editing yet, 
                // but we might want to add them later. For now, we just edit customer/pax.
            });
        } else if (!bookingId) {
            reset({
                customer: { name: '', email: '', phone: '', document: '' },
                pax: 1,
                type: 'public'
            });
        }
    }, [booking, bookingId, reset, isOpen]);

    const createMutation = useMutation({
        mutationFn: async (data: BookingFormValues) => {
            if (departureId) {
                return api.post(endpoints.public.joinBooking, {
                    departureId,
                    ...data,
                    date: new Date().toISOString()
                });
            }
            return api.post(endpoints.admin.bookings, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['departures'] });
            onClose();
            reset();
        }
    });

    const onSubmit = (data: BookingFormValues) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold text-white">
                            {bookingId ? 'Edit Booking' : 'New Booking'}
                        </Dialog.Title>
                        <Dialog.Close className="text-white/60 hover:text-white transition-colors">
                            <X size={24} />
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Customer Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <input {...register('customer.name')} placeholder="Full Name" className="glass-input w-full" />
                                    {errors.customer?.name && <span className="text-rose-400 text-xs">{errors.customer.name.message}</span>}
                                </div>
                                <div>
                                    <input {...register('customer.email')} placeholder="Email" className="glass-input w-full" />
                                    {errors.customer?.email && <span className="text-rose-400 text-xs">{errors.customer.email.message}</span>}
                                </div>
                                <div>
                                    <input {...register('customer.phone')} placeholder="Phone (+57...)" className="glass-input w-full" />
                                    {errors.customer?.phone && <span className="text-rose-400 text-xs">{errors.customer.phone.message}</span>}
                                </div>
                                <div className="col-span-2">
                                    <input {...register('customer.document')} placeholder="Document ID" className="glass-input w-full" />
                                    {errors.customer?.document && <span className="text-rose-400 text-xs">{errors.customer.document.message}</span>}
                                </div>
                            </div>
                        </div>

                        {!departureId && !bookingId && (
                            <div className="space-y-4 border-t border-white/10 pt-4">
                                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Trip Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <input {...register('tourId')} placeholder="Tour ID" className="glass-input w-full" />
                                    </div>
                                    <div>
                                        <input type="date" {...register('date')} className="glass-input w-full" />
                                    </div>
                                    <div>
                                        <select {...register('type')} className="glass-input w-full">
                                            <option value="public">Public</option>
                                            <option value="private">Private</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between">
                                <label className="text-white">Pax Count</label>
                                <input type="number" {...register('pax', { valueAsNumber: true })} className="glass-input w-20 text-center" min={1} />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <LiquidButton type="button" variant="ghost" onClick={onClose}>Cancel</LiquidButton>
                            <LiquidButton type="submit" isLoading={createMutation.isPending}>
                                {bookingId ? 'Update Booking' : 'Create Booking'}
                            </LiquidButton>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
