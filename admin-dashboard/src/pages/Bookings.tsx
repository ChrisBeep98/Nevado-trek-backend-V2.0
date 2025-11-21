import { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { GlassCard } from '../components/ui/GlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { BookingModal } from '../components/modals/BookingModal';
import { Search, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { firestoreTimestampToDate } from '../utils/dates';

export default function Bookings() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | undefined>();

    const { data: bookings, isLoading } = useBookings();

    const filteredBookings = bookings?.filter(b => {
        const matchesSearch =
            b.customer.name.toLowerCase().includes(search.toLowerCase()) ||
            b.customer.email.toLowerCase().includes(search.toLowerCase()) ||
            b.bookingId.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter ? b.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    const handleEdit = (id: string) => {
        setSelectedBookingId(id);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedBookingId(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-white">Bookings</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="glass-input pl-10 w-64"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="glass-input"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <LiquidButton onClick={handleNew}>
                        <Plus size={18} />
                        <span>New Booking</span>
                    </LiquidButton>
                </div>
            </div>

            <GlassCard className="flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 p-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-white/60 text-sm">
                                <th className="py-3 px-4">Customer</th>
                                <th className="py-3 px-4">Pax</th>
                                <th className="py-3 px-4">Total</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Created</th>
                                <th className="py-3 px-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center">
                                        <Loader2 className="animate-spin inline text-indigo-500" />
                                    </td>
                                </tr>
                            ) : filteredBookings?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-white/40">
                                        No bookings found
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings?.map((booking) => (
                                    <tr
                                        key={booking.bookingId}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                                        onClick={() => handleEdit(booking.bookingId)}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-white">{booking.customer.name}</div>
                                            <div className="text-xs text-white/40">{booking.customer.email}</div>
                                        </td>
                                        <td className="py-3 px-4 text-white">{booking.pax}</td>
                                        <td className="py-3 px-4 text-white">
                                            ${booking.finalPrice.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs border ${booking.status === 'confirmed' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' :
                                                booking.status === 'paid' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200' :
                                                    booking.status === 'cancelled' ? 'bg-rose-500/20 border-rose-500/50 text-rose-200' :
                                                        'bg-amber-500/20 border-amber-500/50 text-amber-200'
                                                }`}>
                                                {booking.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-white/60 text-sm">
                                            {format(firestoreTimestampToDate(booking.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <LiquidButton variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                                Edit
                                            </LiquidButton>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                bookingId={selectedBookingId}
            />
        </div>
    );
}
