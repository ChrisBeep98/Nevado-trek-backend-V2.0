import { useState } from 'react';
import { useTours } from '../hooks/useTours';

import { GlassCard } from '../components/ui/GlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { Loader2, Plus, Map, Calendar, DollarSign } from 'lucide-react';
import { TourModal } from '../components/modals/TourModal';

export default function Tours() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTourId, setSelectedTourId] = useState<string | undefined>();

    const { data: tours, isLoading, isError, error } = useTours();

    const handleEdit = (id: string) => {
        setSelectedTourId(id);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedTourId(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-white">Tours</h2>
                <LiquidButton onClick={handleNew}>
                    <Plus size={18} />
                    <span>New Tour</span>
                </LiquidButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-500" size={40} />
                    </div>
                ) : isError ? (
                    <div className="col-span-full text-center text-rose-400 py-12">
                        Error loading tours: {error?.message}
                    </div>
                ) : tours?.length === 0 ? (
                    <div className="col-span-full text-center text-white/40 py-12">
                        No tours found. Create one to get started.
                    </div>
                ) : tours?.map((tour) => (
                    <GlassCard
                        key={tour.tourId}
                        className="p-0 flex flex-col h-full cursor-pointer group"
                        onClick={() => handleEdit(tour.tourId)}
                    >
                        <div className="h-40 bg-white/5 relative overflow-hidden">
                            {/* Placeholder for image */}
                            <div className="absolute inset-0 flex items-center justify-center text-white/20">
                                <Map size={40} />
                            </div>
                            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs text-white border border-white/10">
                                {tour.isActive ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{tour.name?.en || 'Unnamed Tour'}</h3>
                                <p className="text-white/60 text-sm line-clamp-2">{tour.description?.en || 'No description available.'}</p>
                            </div>

                            <div className="mt-auto flex items-center justify-between text-sm text-white/40 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{tour.totalDays || 0} Days</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={14} />
                                    <span>From ${tour.pricingTiers?.[3]?.priceUSD ?? 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <TourModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tourId={selectedTourId}
            />
        </div>
    );
}
