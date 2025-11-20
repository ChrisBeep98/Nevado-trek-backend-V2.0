import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Users, MapPin, Settings, Trash2 } from 'lucide-react';
import type { Departure } from '../../types';
import { useBookings } from '../../hooks/useBookings';
import { LiquidButton } from '../ui/LiquidButton';
import { BookingModal } from './BookingModal';
import { format } from 'date-fns';

interface DepartureModalProps {
    isOpen: boolean;
    onClose: () => void;
    departure: Departure | null;
}

export function DepartureModal({ isOpen, onClose, departure }: DepartureModalProps) {
    const { data: bookings, isLoading } = useBookings(departure?.departureId);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | undefined>();

    if (!departure) return null;

    const handleEditBooking = (bookingId: string) => {
        setSelectedBookingId(bookingId);
        setIsBookingModalOpen(true);
    };

    const handleNewBooking = () => {
        setSelectedBookingId(undefined);
        setIsBookingModalOpen(true);
    };

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
                                    <span>Departure Details</span>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${departure.type === 'private' ? 'bg-violet-500/20 border-violet-500/50 text-violet-200' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'}`}>
                                        {departure.type.toUpperCase()}
                                    </span>
                                </Dialog.Title>
                                <Dialog.Description className="text-white/60 text-sm mt-1">
                                    {format(new Date(departure.date), 'PPP')} • {departure.currentPax}/{departure.maxPax} Pax
                                </Dialog.Description>
                            </div>
                            <Dialog.Close className="text-white/60 hover:text-white transition-colors">
                                <X size={24} />
                            </Dialog.Close>
                        </div>

                        {/* Tabs */}
                        <Tabs.Root defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 border-b border-white/10">
                                <Tabs.List className="flex gap-6">
                                    <Tabs.Trigger value="overview" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors">
                                        Overview
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="bookings" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors">
                                        Bookings ({bookings?.length || 0})
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="settings" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors">
                                        Settings
                                    </Tabs.Trigger>
                                </Tabs.List>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <Tabs.Content value="overview" className="outline-none flex flex-col gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="glass-panel p-4 rounded-xl">
                                            <div className="flex items-center gap-2 text-white/60 mb-2">
                                                <Users size={16} />
                                                <span className="text-sm">Capacity</span>
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {departure.currentPax} <span className="text-sm text-white/40">/ {departure.maxPax}</span>
                                            </div>
                                            <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                                                    style={{ width: `${(departure.currentPax / departure.maxPax) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="glass-panel p-4 rounded-xl">
                                            <div className="flex items-center gap-2 text-white/60 mb-2">
                                                <MapPin size={16} />
                                                <span className="text-sm">Tour ID</span>
                                            </div>
                                            <div className="text-lg font-bold text-white truncate" title={departure.tourId}>
                                                {departure.tourId}
                                            </div>
                                        </div>
                                    </div>
                                </Tabs.Content>

                                <Tabs.Content value="bookings" className="outline-none">
                                    <div className="flex justify-end mb-4">
                                        <LiquidButton size="sm" onClick={handleNewBooking}>
                                            + Add Booking
                                        </LiquidButton>
                                    </div>

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
                                                    className="glass-panel p-4 rounded-xl hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group"
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
                                                        <Settings size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Tabs.Content>

                                <Tabs.Content value="settings" className="outline-none flex flex-col gap-4">
                                    <div className="glass-panel p-4 rounded-xl border border-rose-500/20">
                                        <h3 className="text-rose-400 font-bold mb-2 flex items-center gap-2">
                                            <Trash2 size={18} />
                                            Danger Zone
                                        </h3>
                                        <p className="text-white/60 text-sm mb-4">
                                            Deleting a departure is only possible if there are no active bookings.
                                        </p>
                                        <LiquidButton variant="danger" disabled={departure.currentPax > 0}>
                                            Delete Departure
                                        </LiquidButton>
                                    </div>
                                </Tabs.Content>
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
