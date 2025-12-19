import { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { GlassCard } from '../components/ui/GlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { BookingModal } from '../components/modals/BookingModal';
import { Search, Plus, Loader2, ChevronDown } from 'lucide-react';
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
    }).sort((a, b) => {
        const dateA = firestoreTimestampToDate(a.createdAt).getTime();
        const dateB = firestoreTimestampToDate(b.createdAt).getTime();
        return dateB - dateA;
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <h2 className="text-2xl font-bold text-white">Bookings</h2>
                
                <div className="flex flex-wrap items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
                    {/* Search Field */}
                    <div className="flex items-center gap-2 px-3 border-r border-white/10">
                        <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold whitespace-nowrap">Search:</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                            <input
                                type="text"
                                placeholder="Name, email or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent border-none text-sm text-white placeholder-white/20 focus:outline-none w-48 py-1.5 pl-8"
                                data-testid="search-bookings-input"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 px-3">
                        <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold whitespace-nowrap">Status:</label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none bg-transparent border-none text-sm text-white focus:outline-none pr-8 py-1.5 cursor-pointer [&>option]:bg-slate-900"
                                data-testid="status-filter-select"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={14} />
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 mx-1 hidden md:block" />

                    <LiquidButton onClick={handleNew} size="sm" className="h-9 px-4" data-testid="new-booking-button">
                        <Plus size={16} />
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
                                        data-testid={`booking-row-${booking.bookingId}`}
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
                                            <div className="text-white/80">
                                                {format(firestoreTimestampToDate(booking.createdAt), 'MMM d, yyyy')}
                                            </div>
                                            <div className="text-[10px] opacity-60">
                                                {format(firestoreTimestampToDate(booking.createdAt), 'HH:mm')}
                                            </div>
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
