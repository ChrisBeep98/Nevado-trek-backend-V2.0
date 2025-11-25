import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Users, MapPin, Settings, Trash2, Calendar, Split, ArrowRightLeft, DollarSign, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { firestoreTimestampToDate, formatDateUTC } from '../../utils/dates';
import type { Departure } from '../../types';
import { useBookings, useBookingMutations } from '../../hooks/useBookings';
import { useDepartureMutations } from '../../hooks/useDepartures';
import { useTours } from '../../hooks/useTours';
import { LiquidButton } from '../ui/LiquidButton';
import { BookingModal } from './BookingModal';

interface DepartureModalProps {
    isOpen: boolean;
    onClose: () => void;
    departure: Departure | null;
}

const editSchema = z.object({
    date: z.string().min(1),
    maxPax: z.number().min(1),
    tourId: z.string().min(1),
    type: z.enum(['public', 'private']).optional(),
    price: z.number().min(0).optional()
});

type EditFormValues = z.infer<typeof editSchema>;

export function DepartureModal({ isOpen, onClose, departure }: DepartureModalProps) {
    const { data: bookings, isLoading } = useBookings(departure?.departureId);
    const { updateDeparture, splitDeparture, deleteDeparture, updateDate, updateTour, createDeparture } = useDepartureMutations();
    const { convertType } = useBookingMutations();
    const { data: tours, isLoading: isLoadingTours } = useTours();

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | undefined>();
    const [splitMode, setSplitMode] = useState(false);
    const [selectedBookingForSplit, setSelectedBookingForSplit] = useState<string | null>(null);

    // New state for tools
    const [newDate, setNewDate] = useState('');
    const [newTourId, setNewTourId] = useState('');

    const { register, handleSubmit, reset } = useForm<EditFormValues>({
        resolver: zodResolver(editSchema)
    });

    const isCreating = !departure?.departureId;

    useEffect(() => {
        if (departure) {
            reset({
                date: departure.date ? new Date(firestoreTimestampToDate(departure.date)).toISOString().split('T')[0] : '',
                maxPax: departure.maxPax,
                tourId: departure.tourId,
                type: departure.type as 'public' | 'private',
                price: (departure as any).price || 0
            });
        }
    }, [departure, reset]);

    if (!departure) return null;

    const handleEditBooking = (bookingId: string) => {
        if (splitMode) {
            setSelectedBookingForSplit(bookingId);
        } else {
            setSelectedBookingId(bookingId);
            setIsBookingModalOpen(true);
        }
    };

    const handleNewBooking = () => {
        setSelectedBookingId(undefined);
        setIsBookingModalOpen(true);
    };

    const onUpdateSubmit = (data: EditFormValues) => {
        if (isCreating) {
            createDeparture.mutate({
                tourId: data.tourId,
                date: new Date(data.date).toISOString(),
                maxPax: data.maxPax,
                type: data.type || 'public',
                price: data.price || 0
            }, {
                onSuccess: () => onClose()
            });
        } else {
            updateDeparture.mutate({
                id: departure.departureId,
                data: {
                    date: new Date(data.date).toISOString(),
                    maxPax: data.maxPax,
                    tourId: data.tourId
                }
            }, {
                onSuccess: () => onClose()
            });
        }
    };

    const handleSplit = () => {
        if (selectedBookingForSplit) {
            splitDeparture.mutate({
                id: departure.departureId,
                bookingId: selectedBookingForSplit
            }, {
                onSuccess: () => {
                    setSplitMode(false);
                    setSelectedBookingForSplit(null);
                    onClose();
                }
            });
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this departure? This action cannot be undone.')) {
            deleteDeparture.mutate(departure.departureId, {
                onSuccess: () => onClose()
            });
        }
    };

    const handleChangeDate = () => {
        if (newDate) {
            updateDate.mutate({ id: departure.departureId, newDate: new Date(newDate).toISOString() }, {
                onSuccess: () => {
                    setNewDate('');
                    onClose();
                }
            });
        }
    };

    const handleChangeTour = () => {
        if (newTourId) {
            updateTour.mutate({ id: departure.departureId, newTourId }, {
                onSuccess: () => {
                    setNewTourId('');
                    onClose();
                }
            });
        }
    };

    const handleConvertToPublic = () => {
        if (bookings && bookings.length > 0 && departure.type === 'private') {
            if (confirm('Are you sure you want to convert this private departure to public? This will allow other bookings to join.')) {
                // Get the first booking (private departures should only have 1 booking)
                const booking = bookings[0];
                convertType.mutate(
                    { id: booking.bookingId, targetType: 'public' },
                    { onSuccess: () => onClose() }
                );
            }
        }
    };

    const tourName = tours?.find(t => t.tourId === departure.tourId)?.name.en || departure.tourId;
    const currentPax = departure.currentPax < 0 ? 0 : departure.currentPax;

    return (
        <>
            <Dialog.Root open={isOpen} onOpenChange={onClose}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                            <div>
                                <Dialog.Title className="text-xl font-bold text-white flex items-center gap-3">
                                    <span>{isCreating ? 'New Departure' : 'Departure Details'}</span>
                                    {!isCreating && (
                                        <span className={`text-xs px-2 py-1 rounded-full border ${departure.type === 'private' ? 'bg-violet-500/20 border-violet-500/50 text-violet-200' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'}`}>
                                            {departure.type.toUpperCase()}
                                        </span>
                                    )}
                                </Dialog.Title>
                                {!isCreating && (
                                    <Dialog.Description className="text-white/60 text-sm mt-1">
                                        {departure.date ? formatDateUTC(departure.date) : 'No date'} • {currentPax}/{departure.maxPax} Pax
                                    </Dialog.Description>
                                )}
                            </div>
                            <Dialog.Close className="text-white/60 hover:text-white transition-colors">
                                <X size={24} />
                            </Dialog.Close>
                        </div>

                        {/* Tabs */}
                        <Tabs.Root defaultValue="overview" className="flex-1 flex flex-col overflow-hidden min-h-0">
                            <div className="px-6 border-b border-white/10">
                                <Tabs.List className="flex gap-6">
                                    <Tabs.Trigger value="overview" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors" data-testid="tab-overview">
                                        Overview
                                    </Tabs.Trigger>
                                    {!isCreating && (
                                        <>
                                            <Tabs.Trigger value="bookings" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors" data-testid="tab-bookings">
                                                Bookings ({bookings?.length || 0})
                                            </Tabs.Trigger>
                                            <Tabs.Trigger value="tools" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors" data-testid="tab-tools">
                                                Tools
                                            </Tabs.Trigger>
                                        </>
                                    )}
                                </Tabs.List>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <Tabs.Content value="overview" className="outline-none flex flex-col gap-6">
                                    {!isCreating && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="glass-panel p-4 rounded-xl">
                                                <div className="flex items-center gap-2 text-white/60 mb-2">
                                                    <Users size={16} />
                                                    <span className="text-sm">Capacity</span>
                                                </div>
                                                <div className="text-2xl font-bold text-white">
                                                    {currentPax} <span className="text-sm text-white/40">/ {departure.maxPax}</span>
                                                </div>
                                                <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                                                        style={{ width: `${(currentPax / departure.maxPax) * 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="glass-panel p-4 rounded-xl">
                                                <div className="flex items-center gap-2 text-white/60 mb-2">
                                                    <MapPin size={16} />
                                                    <span className="text-sm">Tour</span>
                                                </div>
                                                <div className="text-lg font-bold text-white truncate" title={tourName}>
                                                    {tourName}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit(onUpdateSubmit)} className="glass-panel p-6 rounded-xl space-y-4">
                                        <h3 className="text-white font-medium flex items-center gap-2">
                                            <Calendar size={18} /> {isCreating ? 'Create Departure' : 'Edit Details'}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-white/60 text-sm">Date</label>
                                                <input
                                                    type="date"
                                                    {...register('date')}
                                                    className="glass-input w-full"
                                                    data-testid="input-date"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-white/60 text-sm">Max Pax</label>
                                                <input
                                                    type="number"
                                                    {...register('maxPax', { valueAsNumber: true })}
                                                    className="glass-input w-full"
                                                    data-testid="input-max-pax"
                                                />
                                            </div>
                                        </div>

                                        {isCreating && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-white/60 text-sm flex items-center gap-2">
                                                        <Tag size={14} /> Type
                                                    </label>
                                                    <select {...register('type')} className="glass-input w-full [&>option]:bg-slate-900" data-testid="select-type">
                                                        <option value="public">Public</option>
                                                        <option value="private">Private</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-white/60 text-sm flex items-center gap-2">
                                                        <DollarSign size={14} /> Price
                                                    </label>
                                                    <input
                                                        type="number"
                                                        {...register('price', { valueAsNumber: true })}
                                                        className="glass-input w-full"
                                                        placeholder="0"
                                                        data-testid="input-price"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 pt-4 border-t border-white/10">
                                            <label className="text-white/60 text-sm flex items-center gap-2">
                                                <ArrowRightLeft size={14} /> {isCreating ? 'Select Tour' : 'Change Tour'}
                                            </label>
                                            <select {...register('tourId')} className="glass-input w-full [&>option]:bg-slate-900" disabled={isLoadingTours} data-testid="select-tour">
                                                <option value="">Select tour...</option>
                                                {isLoadingTours ? (
                                                    <option>Loading tours...</option>
                                                ) : (
                                                    tours?.map(tour => (
                                                        <option key={tour.tourId} value={tour.tourId}>
                                                            {tour.name.en}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <LiquidButton type="submit" isLoading={isCreating ? createDeparture.isPending : updateDeparture.isPending} data-testid={isCreating ? "create-departure-button" : "save-departure-button"}>
                                                {isCreating ? 'Create Departure' : 'Save Changes'}
                                            </LiquidButton>
                                        </div>
                                    </form>
                                </Tabs.Content>

                                {!isCreating && (
                                    <>
                                        <Tabs.Content value="bookings" className="outline-none">
                                            <div className="flex justify-between mb-4">
                                                <LiquidButton
                                                    size="sm"
                                                    variant={splitMode ? "primary" : "ghost"}
                                                    onClick={() => setSplitMode(!splitMode)}
                                                    className={splitMode ? "bg-indigo-500 hover:bg-indigo-600" : ""}
                                                    data-testid="split-departure-button"
                                                >
                                                    <Split size={16} className="mr-2" />
                                                    {splitMode ? "Cancel Split" : "Split Departure"}
                                                </LiquidButton>
                                                <LiquidButton size="sm" onClick={handleNewBooking} disabled={splitMode} data-testid="add-booking-button">
                                                    + Add Booking
                                                </LiquidButton>
                                            </div>

                                            {splitMode && (
                                                <div className="mb-4 p-4 bg-indigo-500/20 border border-indigo-500/50 rounded-xl text-indigo-200 text-sm">
                                                    Select a booking to move to a new departure. This will create a new departure with the same details and move the selected booking to it.
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-2">
                                                {isLoading ? (
                                                    <div className="text-white/40 text-center py-8">Loading bookings...</div>
                                                ) : bookings?.length === 0 ? (
                                                    <div className="text-white/40 text-center py-8">No bookings yet</div>
                                                ) : (
                                                    bookings?.map((booking) => (
                                                        <div
                                                            key={booking.bookingId}
                                                            onClick={() => handleEditBooking(booking.bookingId)}
                                                            className={`glass-panel p-4 rounded-xl hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group ${selectedBookingForSplit === booking.bookingId ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''
                                                                }`}
                                                            data-testid={`booking-item-${booking.bookingId}`}
                                                        >
                                                            <div>
                                                                <div className="font-bold text-white">{booking.customer.name}</div>
                                                                <div className="text-sm text-white/60">{booking.customer.email}</div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-right">
                                                                    <div className="text-white font-medium">{booking.pax} Pax</div>
                                                                    <div className={`text-xs ${booking.status === 'confirmed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                        {booking.status.toUpperCase()}
                                                                    </div>
                                                                </div>
                                                                {splitMode ? (
                                                                    <Split size={16} className="text-indigo-400" />
                                                                ) : (
                                                                    <Settings size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {splitMode && selectedBookingForSplit && (
                                                <div className="mt-4 flex justify-end">
                                                    <LiquidButton onClick={handleSplit} isLoading={splitDeparture.isPending}>
                                                        Confirm Split
                                                    </LiquidButton>
                                                </div>
                                            )}
                                        </Tabs.Content>

                                        <Tabs.Content value="tools" className="outline-none flex flex-col gap-4">
                                            {/* Change Date */}
                                            <div className="glass-panel p-4 rounded-xl space-y-4">
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <Calendar size={18} /> Change Departure Date
                                                </h3>
                                                {bookings && bookings.length > 0 && (
                                                    <p className="text-xs text-amber-200 bg-amber-500/10 p-2 rounded">
                                                        ⚠️ This will update the date for all {bookings.length} bookings
                                                    </p>
                                                )}
                                                <div className="flex gap-4">
                                                    <input
                                                        type="date"
                                                        className="glass-input flex-1"
                                                        value={newDate}
                                                        onChange={e => setNewDate(e.target.value)}
                                                    />
                                                    <LiquidButton
                                                        size="sm"
                                                        onClick={handleChangeDate}
                                                        isLoading={updateDate.isPending}
                                                        disabled={!newDate}
                                                    >
                                                        Update Date
                                                    </LiquidButton>
                                                </div>
                                            </div>

                                            {/* Change Tour */}
                                            <div className="glass-panel p-4 rounded-xl space-y-4">
                                                <h3 className="text-white font-medium flex items-center gap-2">
                                                    <ArrowRightLeft size={18} /> Change Tour
                                                </h3>
                                                {bookings && bookings.length > 0 && (
                                                    <p className="text-xs text-amber-200 bg-amber-500/10 p-2 rounded">
                                                        ⚠️ This will recalculate prices for all {bookings.length} bookings
                                                    </p>
                                                )}
                                                <div className="flex gap-4">
                                                    <select
                                                        className="glass-input flex-1 [&>option]:bg-slate-900"
                                                        value={newTourId}
                                                        onChange={e => setNewTourId(e.target.value)}
                                                    >
                                                        <option value="">Select new tour...</option>
                                                        {tours?.map(t => (
                                                            <option key={t.tourId} value={t.tourId}>
                                                                {t.name?.es || t.name?.en}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <LiquidButton
                                                        size="sm"
                                                        onClick={handleChangeTour}
                                                        isLoading={updateTour.isPending}
                                                        disabled={!newTourId}
                                                    >
                                                        Update Tour
                                                    </LiquidButton>
                                                </div>
                                            </div>

                                            {/* Convert to Public - Only for Private departures */}
                                            {departure.type === 'private' && (
                                                <div className="glass-panel p-4 rounded-xl space-y-4 border border-indigo-500/20">
                                                    <h3 className="text-white font-medium flex items-center gap-2">
                                                        <ArrowRightLeft size={18} /> Convert to Public
                                                    </h3>
                                                    <p className="text-sm text-white/60">
                                                        Convert this private departure to a public one. The booking will become public and the departure can accept additional bookings.
                                                    </p>
                                                    {bookings && bookings.length > 0 && (
                                                        <p className="text-xs text-amber-200 bg-amber-500/10 p-2 rounded">
                                                            ⚠️ This will convert {bookings.length} booking(s) to public
                                                        </p>
                                                    )}
                                                    <LiquidButton
                                                        onClick={handleConvertToPublic}
                                                        isLoading={convertType.isPending}
                                                        disabled={!bookings || bookings.length === 0}
                                                        data-testid="convert-to-public-button"
                                                    >
                                                        Convert to Public
                                                    </LiquidButton>
                                                </div>
                                            )}

                                            <div className="glass-panel p-4 rounded-xl border border-rose-500/20">
                                                <h3 className="text-rose-400 font-bold mb-2 flex items-center gap-2">
                                                    <Trash2 size={18} />
                                                    Danger Zone
                                                </h3>
                                                <p className="text-white/60 text-sm mb-4">
                                                    Deleting a departure is only possible if there are no active bookings.
                                                </p>
                                                <LiquidButton
                                                    variant="danger"
                                                    disabled={departure.currentPax > 0 || deleteDeparture.isPending}
                                                    onClick={handleDelete}
                                                    data-testid="delete-departure-button"
                                                >
                                                    {deleteDeparture.isPending ? 'Deleting...' : 'Delete Departure'}
                                                </LiquidButton>
                                            </div>
                                        </Tabs.Content>
                                    </>
                                )}
                            </div>
                        </Tabs.Root>

                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                bookingId={selectedBookingId}
                departureId={departure.departureId}
            />
        </>
    );
}
