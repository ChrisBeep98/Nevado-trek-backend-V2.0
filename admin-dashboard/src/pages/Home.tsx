import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useDepartures } from '../hooks/useDepartures';
import { GlassCard } from '../components/ui/GlassCard';
import { Loader2, Plus } from 'lucide-react';
import { LiquidButton } from '../components/ui/LiquidButton';
import type { Departure } from '../types';
import { DepartureModal } from '../components/modals/DepartureModal';

export default function Home() {
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>();
    const { data: departures, isLoading } = useDepartures(dateRange?.start?.toISOString(), dateRange?.end?.toISOString());
    const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDatesSet = (arg: { start: Date; end: Date }) => {
        setDateRange({ start: arg.start, end: arg.end });
    };

    const handleNewDeparture = () => {
        setSelectedDeparture({
            departureId: '',
            tourId: '',
            date: new Date().toISOString(), // Will be converted to YYYY-MM-DD in modal
            maxPax: 10,
            currentPax: 0,
            type: 'public',
            status: 'open',
            price: 0
        } as Departure);
        setIsModalOpen(true);
    };

    const events = departures?.map((dep: Departure) => ({
        id: dep.departureId,
        title: `${Math.max(0, dep.currentPax)}/${dep.maxPax} Pax`,
        start: dep.date,
        backgroundColor: dep.type === 'private' ? '#8b5cf6' : (dep.currentPax >= dep.maxPax ? '#f43f5e' : '#10b981'),
        borderColor: 'transparent',
        extendedProps: { ...dep }
    })) || [];

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-white">Calendar</h2>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Public Open</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Public Full</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-violet-500"></div> Private</span>
                    </div>
                    <LiquidButton onClick={handleNewDeparture} data-testid="new-departure-button">
                        <Plus size={18} />
                        <span>New Departure</span>
                    </LiquidButton>
                </div>
            </div>

            <GlassCard className="flex-1 p-6 overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-500" size={40} />
                    </div>
                )}

                <div className="h-full calendar-wrapper">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,dayGridWeek'
                        }}
                        events={events}
                        datesSet={handleDatesSet}
                        height="100%"
                        eventContent={(arg) => (
                            <div className="flex flex-col gap-1 p-1" data-testid={`event-${arg.event.id}`}>
                                <div className="text-xs font-bold">{arg.event.title}</div>
                                <div className="text-[10px] opacity-80 truncate">
                                    {arg.event.extendedProps.type === 'private' ? 'Private' : 'Public'}
                                </div>
                            </div>
                        )}
                        eventClick={(info) => {
                            setSelectedDeparture(info.event.extendedProps as Departure);
                            setIsModalOpen(true);
                        }}
                    />
                </div>
            </GlassCard>

            <DepartureModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                departure={selectedDeparture}
            />

            <style>{`
        .calendar-wrapper .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; }
        .calendar-wrapper .fc-button { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
        .calendar-wrapper .fc-button:hover { background: rgba(255,255,255,0.2); }
        .calendar-wrapper .fc-button-active { background: rgba(255,255,255,0.3) !important; border-color: rgba(255,255,255,0.2) !important; }
        .calendar-wrapper .fc-daygrid-day { border-color: rgba(255,255,255,0.05); }
        .calendar-wrapper .fc-col-header-cell { border-color: rgba(255,255,255,0.05); padding: 8px 0; }
        .calendar-wrapper .fc-scrollgrid { border-color: rgba(255,255,255,0.05); }
        .calendar-wrapper .fc-day-today { background: rgba(255,255,255,0.02) !important; }
      `}</style>
        </div>
    );
}
