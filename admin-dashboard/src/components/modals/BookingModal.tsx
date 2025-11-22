import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, User, Calendar, CreditCard, ArrowRightLeft, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api, endpoints } from '../../lib/api';
import { LiquidButton } from '../ui/LiquidButton';
import { useBookingMutations } from '../../hooks/useBookings';
import type { Booking } from '../../types';

// Schemas
const customerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(1, 'Phone is required'),
    document: z.string().min(1, 'Document is required'),
    note: z.string().optional(),
});

const bookingSchema = z.object({
    customer: customerSchema,
    pax: z.number().min(1, 'Min 1 pax'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId?: string;
    departureId?: string;
}

export function BookingModal({ isOpen, onClose, bookingId, departureId }: BookingModalProps) {
    const { createBooking, updateDetails, updatePax, updateStatus, applyDiscount, moveBooking, convertType } = useBookingMutations();

    // State for actions
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [discountReason, setDiscountReason] = useState('');
    const [moveTourId, setMoveTourId] = useState('');
    const [moveDate, setMoveDate] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            pax: 1,
            customer: { name: '', email: '', phone: '', document: '' }
        }
    });

    const { data: booking, isLoading: isLoadingBooking } = useQuery({
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
                    name: booking.customer.name || '',
                    email: booking.customer.email || '',
                    phone: booking.customer.phone || '',
                    document: booking.customer.document || '',
                    note: booking.customer.note || ''
                },
                pax: booking.pax || 1,
            });
        } else if (!bookingId) {
            reset({
                customer: { name: '', email: '', phone: '', document: '' },
                pax: 1,
            });
        }
    }, [booking, bookingId, reset, isOpen]);



    const [manualDepartureId, setManualDepartureId] = useState('');

    const onSubmit = (data: BookingFormValues) => {
        if (bookingId) {
            // Update existing booking details
            updateDetails.mutate({ id: bookingId, customer: data.customer });
            if (booking?.pax !== data.pax) {
                updatePax.mutate({ id: bookingId, pax: data.pax });
            }
            onClose();
        } else {
            const targetDepartureId = departureId || manualDepartureId;
            if (targetDepartureId) {
                // Create new booking for departure
                createBooking.mutate({
                    departureId: targetDepartureId,
                    ...data,
                    date: new Date().toISOString(), // Backend handles date from departure usually, but required by schema
                    type: 'public' // Default for now
                }, { onSuccess: onClose });
            }
        }
    };

    const handleStatusChange = (status: string) => {
        if (bookingId) {
            updateStatus.mutate({ id: bookingId, status });
        }
    };

    const handleApplyDiscount = () => {
        if (bookingId && discountAmount > 0 && discountReason) {
            applyDiscount.mutate({ id: bookingId, amount: discountAmount, reason: discountReason });
            setDiscountAmount(0);
            setDiscountReason('');
        }
    };

    const handleMoveBooking = () => {
        if (bookingId && moveTourId && moveDate) {
            moveBooking.mutate({ id: bookingId, newTourId: moveTourId, newDate: new Date(moveDate).toISOString() }, {
                onSuccess: onClose
            });
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                    <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                        <Dialog.Title className="text-xl font-bold text-white">
                            {bookingId ? 'Manage Booking' : 'New Booking'}
                        </Dialog.Title>
                        <Dialog.Close className="text-white/60 hover:text-white transition-colors" data-testid="close-modal-button">
                            <X size={24} />
                        </Dialog.Close>
                    </div>

                    {isLoadingBooking ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <Tabs.Root defaultValue="details" className="flex-1 flex flex-col overflow-hidden min-h-0">
                            <div className="px-6 border-b border-white/10">
                                <Tabs.List className="flex gap-6">
                                    <Tabs.Trigger value="details" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors" data-testid="tab-details">
                                        Details
                                    </Tabs.Trigger>
                                    {bookingId && (
                                        <>
                                            <Tabs.Trigger value="status" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors" data-testid="tab-status">
                                                Status & Type
                                            </Tabs.Trigger>
                                            <Tabs.Trigger value="actions" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors" data-testid="tab-actions">
                                                Actions
                                            </Tabs.Trigger>
                                        </>
                                    )}
                                </Tabs.List>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <Tabs.Content value="details" className="outline-none">
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                        {!bookingId && !departureId && (
                                            <div className="space-y-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                <label className="text-amber-200 text-sm font-medium">Departure ID (Required)</label>
                                                <input
                                                    value={manualDepartureId}
                                                    onChange={(e) => setManualDepartureId(e.target.value)}
                                                    placeholder="Enter Departure ID"
                                                    className="glass-input w-full"
                                                    data-testid="input-departure-id"
                                                />
                                                <p className="text-xs text-amber-200/60">Enter the ID of the departure to add this booking to.</p>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                                                <User size={16} /> Customer Info
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <input data-testid="input-customer-name" {...register('customer.name')} placeholder="Full Name" className="glass-input w-full" />
                                                    {errors.customer?.name && <span className="text-rose-400 text-xs">{errors.customer.name.message}</span>}
                                                </div>
                                                <div>
                                                    <input data-testid="input-customer-email" {...register('customer.email')} placeholder="Email" className="glass-input w-full" />
                                                    {errors.customer?.email && <span className="text-rose-400 text-xs">{errors.customer.email.message}</span>}
                                                </div>
                                                <div>
                                                    <input data-testid="input-customer-phone" {...register('customer.phone')} placeholder="Phone (+57...)" className="glass-input w-full" />
                                                    {errors.customer?.phone && <span className="text-rose-400 text-xs">{errors.customer.phone.message}</span>}
                                                </div>
                                                <div className="col-span-2">
                                                    <input data-testid="input-customer-document" {...register('customer.document')} placeholder="Document ID" className="glass-input w-full" />
                                                    {errors.customer?.document && <span className="text-rose-400 text-xs">{errors.customer.document.message}</span>}
                                                </div>
                                                <div className="col-span-2">
                                                    <textarea data-testid="input-customer-note" {...register('customer.note')} placeholder="Notes..." className="glass-input w-full h-20 resize-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t border-white/10 pt-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-white font-medium">Pax Count</label>
                                                <input data-testid="input-pax" type="number" {...register('pax', { valueAsNumber: true })} className="glass-input w-24 text-center" min={1} />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4">
                                            <LiquidButton type="submit" isLoading={updateDetails.isPending || updatePax.isPending || createBooking.isPending} data-testid="submit-booking-button">
                                                {bookingId ? 'Save Changes' : 'Create Booking'}
                                            </LiquidButton>
                                        </div>
                                    </form>
                                </Tabs.Content>

                                {bookingId && booking && (
                                    <>
                                        <Tabs.Content value="status" className="outline-none space-y-6">
                                            <div className="glass-panel p-4 rounded-xl space-y-4">
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <CreditCard size={18} /> Payment Status
                                                </h3>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['pending', 'confirmed', 'paid', 'cancelled'].map((status) => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            onClick={() => handleStatusChange(status)}
                                                            className={`p-3 rounded-lg border transition-all ${booking.status === status
                                                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
                                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                                                }`}
                                                            data-testid={`status-button-${status}`}
                                                        >
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="glass-panel p-4 rounded-xl space-y-4">
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <ArrowRightLeft size={18} /> Booking Type
                                                </h3>
                                                <div className="flex gap-4">
                                                    <LiquidButton
                                                        variant="ghost"
                                                        className="flex-1"
                                                        onClick={() => convertType.mutate({ id: bookingId, targetType: 'public' })}
                                                        data-testid="convert-public-button"
                                                    >
                                                        Convert to Public
                                                    </LiquidButton>
                                                    <LiquidButton
                                                        variant="ghost"
                                                        className="flex-1"
                                                        onClick={() => convertType.mutate({ id: bookingId, targetType: 'private' })}
                                                        data-testid="convert-private-button"
                                                    >
                                                        Convert to Private
                                                    </LiquidButton>
                                                </div>
                                            </div>
                                        </Tabs.Content>

                                        <Tabs.Content value="actions" className="outline-none space-y-6">
                                            {/* Discount */}
                                            <div className="glass-panel p-4 rounded-xl space-y-4">
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <Tag size={18} /> Apply Discount
                                                </h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="number"
                                                        placeholder="Amount (COP)"
                                                        className="glass-input w-full"
                                                        value={discountAmount || ''}
                                                        onChange={e => setDiscountAmount(Number(e.target.value))}
                                                        data-testid="input-discount-amount"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Reason"
                                                        className="glass-input w-full"
                                                        value={discountReason}
                                                        onChange={e => setDiscountReason(e.target.value)}
                                                        data-testid="input-discount-reason"
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <LiquidButton
                                                        size="sm"
                                                        onClick={handleApplyDiscount}
                                                        isLoading={applyDiscount.isPending}
                                                        disabled={!discountAmount || !discountReason}
                                                        data-testid="apply-discount-button"
                                                    >
                                                        Apply Discount
                                                    </LiquidButton>
                                                </div>
                                            </div>

                                            {/* Move Booking */}
                                            <div className="glass-panel p-4 rounded-xl space-y-4 border border-amber-500/20">
                                                <h3 className="text-amber-400 font-medium flex items-center gap-2">
                                                    <Calendar size={18} /> Move Booking
                                                </h3>
                                                <p className="text-xs text-white/40">Move this booking to a different tour or date.</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="New Tour ID"
                                                        className="glass-input w-full"
                                                        value={moveTourId}
                                                        onChange={e => setMoveTourId(e.target.value)}
                                                        data-testid="input-move-tour-id"
                                                    />
                                                    <input
                                                        type="date"
                                                        className="glass-input w-full"
                                                        value={moveDate}
                                                        onChange={e => setMoveDate(e.target.value)}
                                                        data-testid="input-move-date"
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <LiquidButton
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={handleMoveBooking}
                                                        isLoading={moveBooking.isPending}
                                                        disabled={!moveTourId || !moveDate}
                                                        data-testid="move-booking-button"
                                                    >
                                                        Move Booking
                                                    </LiquidButton>
                                                </div>
                                            </div>
                                        </Tabs.Content>
                                    </>
                                )}
                            </div>
                        </Tabs.Root>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
