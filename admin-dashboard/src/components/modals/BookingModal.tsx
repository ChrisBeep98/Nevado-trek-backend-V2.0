import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, User, Calendar, CreditCard, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api, endpoints } from '../../lib/api';
import { LiquidButton } from '../ui/LiquidButton';
import { useBookingMutations } from '../../hooks/useBookings';
import { useDepartureMutations } from '../../hooks/useDepartures';
import { formatDateUTC } from '../../utils/dates';
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
    const { createBooking, updateDetails, updatePax, updateStatus, applyDiscount, convertType } = useBookingMutations();
    const { updateDate, updateTour } = useDepartureMutations();

    // State for actions
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [newFinalPrice, setNewFinalPrice] = useState<number>(0);
    const [priceMode, setPriceMode] = useState<'discount' | 'direct'>('discount');
    const [discountReason, setDiscountReason] = useState('');
    const [newTourId, setNewTourId] = useState('');
    const [newDate, setNewDate] = useState('');

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

    // Fetch departure info
    const { data: departure, isLoading: isLoadingDeparture } = useQuery({
        queryKey: ['departure', booking?.departureId],
        queryFn: async () => {
            if (!booking?.departureId) return null;
            try {
                const res = await api.get(endpoints.admin.departure(booking.departureId));
                return res.data;
            } catch (error) {
                console.error("Failed to fetch departure", error);
                return null;
            }
        },
        enabled: !!booking?.departureId
    });

    // Fetch tour info
    const { data: tour, isLoading: isLoadingTour } = useQuery({
        queryKey: ['tour', departure?.tourId],
        queryFn: async () => {
            if (!departure?.tourId) return null;
            try {
                const { data } = await api.get(endpoints.admin.tour(departure.tourId));
                return data.tour || data;
            } catch (error) {
                console.error("Failed to fetch tour", error);
                return null;
            }
        },
        enabled: !!departure?.tourId
    });

    // Fetch related bookings (only for public departures)
    const { data: relatedBookings = [] } = useQuery({
        queryKey: ['bookings', 'departure', booking?.departureId],
        queryFn: async () => {
            if (!booking?.departureId) return [];
            const { data } = await api.get(endpoints.admin.bookings, {
                params: { departureId: booking.departureId }
            });
            const bookings = data.bookings || data;
            return bookings.filter((b: Booking) => b.bookingId !== bookingId);
        },
        enabled: !!booking?.departureId && departure?.type === 'public'
    });

    // FIXED: Use booking.type field instead of pax comparison
    const isPrivateBooking = booking?.type === 'private';

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

            // Update PAX with capacity validation
            if (booking?.pax !== data.pax && departure && booking) {
                // Calculate available space
                // If we are increasing pax, we need to check if there is space
                // The current departure.currentPax includes our current booking.pax
                // So available space is maxPax - (currentPax - ourPax)
                const otherBookingsPax = departure.currentPax - booking.pax;
                const availableSpace = departure.maxPax - otherBookingsPax;

                if (data.pax > availableSpace) {
                    // Show error - not enough capacity
                    alert(`Cannot increase to ${data.pax} pax. Only ${availableSpace} space(s) available in this departure.`);
                    return;
                }

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

    const handleApplyPrice = () => {
        if (!bookingId) return;

        if (priceMode === 'discount' && discountAmount > 0 && discountReason) {
            applyDiscount.mutate({
                id: bookingId,
                discountAmount,
                reason: discountReason
            });
            setDiscountAmount(0);
            setDiscountReason('');
        } else if (priceMode === 'direct' && newFinalPrice >= 0 && discountReason) {
            applyDiscount.mutate({
                id: bookingId,
                newFinalPrice,
                reason: discountReason
            });
            setNewFinalPrice(0);
            setDiscountReason('');
        }
    };

    const handleUpdateDate = () => {
        if (booking?.departureId && newDate) {
            updateDate.mutate(
                { id: booking.departureId, newDate: new Date(newDate).toISOString() },
                {
                    onSuccess: () => {
                        setNewDate('');
                        // Refresh booking data
                    }
                }
            );
        }
    };

    const handleUpdateTour = () => {
        if (booking?.departureId && newTourId) {
            updateTour.mutate(
                { id: booking.departureId, newTourId },
                {
                    onSuccess: () => {
                        setNewTourId('');
                        // Refresh booking data
                    }
                }
            );
        }
    };

    // FIX: Use explicit loading flags instead of derived logic
    const isLoading = isLoadingBooking || isLoadingDeparture || isLoadingTour;

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                    <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                        <Dialog.Title className="text-xl font-bold text-white">
                            {bookingId ? 'Manage Booking' : 'New Booking'}
                        </Dialog.Title>
                        <div className="flex items-center gap-3">
                            {isLoading ? (
                                <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
                            ) : departure ? (
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${departure.type === 'private'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    }`} data-testid="booking-type-chip">
                                    {departure.type === 'private' ? 'Private' : 'Public'}
                                </div>
                            ) : bookingId ? (
                                <div className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    No Departure
                                </div>
                            ) : null}
                            <Dialog.Close className="text-white/60 hover:text-white transition-colors" data-testid="close-modal-button">
                                <X size={24} />
                            </Dialog.Close>
                        </div>
                    </div>

                    {/* Context Section */}
                    {(bookingId || departureId) && (
                        <div className="p-4 bg-slate-800/50 border-b border-white/10 space-y-2">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <div className="h-10 w-24 bg-white/5 rounded animate-pulse" />
                                        <div className="h-10 w-24 bg-white/5 rounded animate-pulse" />
                                        <div className="h-10 w-24 bg-white/5 rounded animate-pulse" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div data-testid="booking-context-tour">
                                            <p className="text-sm text-white/60">Tour</p>
                                            <p className="text-white font-medium">{tour?.name?.es || tour?.name || 'Unknown Tour'}</p>
                                        </div>
                                        <div data-testid="booking-context-date">
                                            <p className="text-sm text-white/60">Date</p>
                                            <p className="text-white font-medium">
                                                {departure?.date ? formatDateUTC(departure.date) : 'N/A'}
                                            </p>
                                        </div>
                                        <div data-testid="booking-context-type">
                                            <p className="text-sm text-white/60">Type</p>
                                            <p className={`font-medium ${departure?.type === 'private' ? 'text-purple-400' : 'text-blue-400'}`}>
                                                {departure?.type === 'private' ? 'Private' : (departure?.type === 'public' ? 'Public' : 'N/A')}
                                            </p>
                                        </div>
                                        {departure?.type === 'public' && (
                                            <div data-testid="booking-context-capacity">
                                                <p className="text-sm text-white/60">Capacity</p>
                                                <p className="text-white font-medium">
                                                    {departure.currentPax}/{departure.maxPax} pax
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Show other bookings if public */}
                                    {departure?.type === 'public' && relatedBookings.length > 0 && (
                                        <div className="pt-2 border-t border-white/10">
                                            <p className="text-xs text-white/60 mb-1">
                                                Other bookings in this departure:
                                            </p>
                                            <div className="space-y-1">
                                                {relatedBookings.map((b: Booking) => (
                                                    <div key={b.bookingId} className="text-xs text-white/80">
                                                        • {b.customer.name} ({b.pax} pax)
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Price info */}
                                    {booking && (
                                        <div className="pt-2 border-t border-white/10 flex gap-4 text-sm">
                                            <div>
                                                <span className="text-white/60">Original:</span>
                                                <span className="text-white ml-2">
                                                    ${booking.originalPrice?.toLocaleString() || 0} COP
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-white/60">Final:</span>
                                                <span className="text-green-400 ml-2 font-medium">
                                                    ${booking.finalPrice?.toLocaleString() || 0} COP
                                                </span>
                                            </div>
                                            {booking.discountReason && (
                                                <div>
                                                    <span className="text-white/60">Discount:</span>
                                                    <span className="text-amber-400 ml-2">
                                                        ${((booking.originalPrice || 0) - (booking.finalPrice || 0)).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

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
                                                    <CreditCard size={18} /> Booking Status
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
                                        </Tabs.Content>

                                        <Tabs.Content value="actions" className="outline-none space-y-6">
                                            {/* Price Update */}
                                            <div className="glass-panel p-4 rounded-xl space-y-4">
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <Tag size={18} /> Update Price
                                                </h3>

                                                {/* Toggle between discount and direct price */}
                                                <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
                                                    <button
                                                        onClick={() => setPriceMode('discount')}
                                                        className={`flex-1 py-2 px-4 rounded transition-all ${priceMode === 'discount'
                                                            ? 'bg-indigo-500 text-white'
                                                            : 'text-white/60 hover:text-white'
                                                            }`}
                                                    >
                                                        Apply Discount
                                                    </button>
                                                    <button
                                                        onClick={() => setPriceMode('direct')}
                                                        className={`flex-1 py-2 px-4 rounded transition-all ${priceMode === 'direct'
                                                            ? 'bg-indigo-500 text-white'
                                                            : 'text-white/60 hover:text-white'
                                                            }`}
                                                    >
                                                        Set Final Price
                                                    </button>
                                                </div>

                                                {priceMode === 'discount' ? (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <input
                                                            type="number"
                                                            placeholder="Discount Amount (COP)"
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
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <input
                                                            type="number"
                                                            placeholder="New Final Price (COP)"
                                                            className="glass-input w-full"
                                                            value={newFinalPrice || ''}
                                                            onChange={e => setNewFinalPrice(Number(e.target.value))}
                                                            data-testid="input-new-price"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Reason"
                                                            className="glass-input w-full"
                                                            value={discountReason}
                                                            onChange={e => setDiscountReason(e.target.value)}
                                                            data-testid="input-price-reason"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex justify-end">
                                                    <LiquidButton
                                                        size="sm"
                                                        onClick={handleApplyPrice}
                                                        isLoading={applyDiscount.isPending}
                                                        disabled={
                                                            (priceMode === 'discount' && (!discountAmount || !discountReason)) ||
                                                            (priceMode === 'direct' && (newFinalPrice === undefined || !discountReason))
                                                        }
                                                        data-testid="apply-price-button"
                                                    >
                                                        {priceMode === 'discount' ? 'Apply Discount' : 'Update Price'}
                                                    </LiquidButton>
                                                </div>
                                            </div>

                                            {/* Move Booking - Conditional */}
                                            {isPrivateBooking ? (
                                                <div className="glass-panel p-4 rounded-xl space-y-4 border border-indigo-500/20">
                                                    <h3 className="text-indigo-400 font-medium flex items-center gap-2">
                                                        <Calendar size={18} /> Change Date/Tour
                                                    </h3>
                                                    <p className="text-xs text-white/40">
                                                        This is a private booking. You can change the date and tour independently.
                                                    </p>

                                                    {/* Update Date */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm text-white/60">Update Date</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="date"
                                                                className="glass-input flex-1"
                                                                value={newDate}
                                                                onChange={e => setNewDate(e.target.value)}
                                                                data-testid="input-update-date"
                                                            />
                                                            <LiquidButton
                                                                size="sm"
                                                                onClick={handleUpdateDate}
                                                                isLoading={updateDate.isPending}
                                                                disabled={!newDate}
                                                                data-testid="button-update-date"
                                                            >
                                                                Update Date
                                                            </LiquidButton>
                                                        </div>
                                                    </div>

                                                    {/* Update Tour */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm text-white/60">Update Tour</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="New Tour ID"
                                                                className="glass-input flex-1"
                                                                value={newTourId}
                                                                onChange={e => setNewTourId(e.target.value)}
                                                                data-testid="input-update-tour"
                                                            />
                                                            <LiquidButton
                                                                size="sm"
                                                                onClick={handleUpdateTour}
                                                                isLoading={updateTour.isPending}
                                                                disabled={!newTourId}
                                                                data-testid="button-update-tour"
                                                            >
                                                                Update Tour
                                                            </LiquidButton>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="glass-panel p-4 rounded-xl space-y-4 border border-amber-500/20 bg-amber-500/5">
                                                    <h3 className="text-amber-400 font-medium flex items-center gap-2">
                                                        <Calendar size={18} /> Change Date/Tour - Blocked
                                                    </h3>
                                                    <p className="text-sm text-amber-200">
                                                        ⚠️ This booking is in a public departure with {relatedBookings.length} other booking(s).
                                                    </p>
                                                    <p className="text-xs text-white/60 mb-3">
                                                        To change the date or tour for this booking only, convert it to private first.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <LiquidButton
                                                            size="sm"
                                                            onClick={() => convertType.mutate({ id: bookingId, targetType: 'private' })}
                                                            isLoading={convertType.isPending}
                                                            data-testid="inline-convert-private-button"
                                                        >
                                                            Convert to Private
                                                        </LiquidButton>
                                                        <p className="text-xs text-white/40 flex items-center">
                                                            Then you can change date/tour
                                                        </p>
                                                    </div>
                                                    <div className="pt-2 border-t border-white/10 mt-3">
                                                        <p className="text-xs text-blue-300">
                                                            💡 Or change date/tour in the Departure modal to update all bookings
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
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
