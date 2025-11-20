import { useQuery } from '@tanstack/react-query';
import { api, endpoints } from '../lib/api';
import { GlassCard } from '../components/ui/GlassCard';
import { Loader2, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';

export default function Stats() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
            const { data } = await api.get(endpoints.admin.stats);
            return data;
        }
    });

    const statCards = [
        { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: Calendar, color: 'text-indigo-400' },
        { label: 'Active Departures', value: stats?.activeDepartures || 0, icon: TrendingUp, color: 'text-emerald-400' },
        { label: 'Total Pax', value: stats?.totalPax || 0, icon: Users, color: 'text-rose-400' },
        { label: 'Revenue (Est)', value: '$0', icon: DollarSign, color: 'text-amber-400' }, // Backend doesn't send revenue yet
    ];

    return (
        <div className="flex flex-col gap-6 h-full">
            <h2 className="text-2xl font-bold text-white shrink-0">Dashboard Stats</h2>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => (
                        <GlassCard key={index} className="p-6 flex items-center gap-4">
                            <div className={`p-3 rounded-lg bg-white/5 ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <div className="text-white/60 text-sm">{stat.label}</div>
                                <div className="text-2xl font-bold text-white">{stat.value}</div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            <GlassCard className="flex-1 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                <div className="text-white/40 text-sm">
                    No recent activity to display.
                </div>
            </GlassCard>
        </div>
    );
}
