import { useFieldArray } from 'react-hook-form';
import type { UseFormRegister, Control } from 'react-hook-form';
import type { TourFormValues } from '../TourModal';
import { LiquidButton } from '../../ui/LiquidButton';
import { Plus } from 'lucide-react';
import { ItineraryDay } from './ItineraryDay';

interface TourItineraryProps {
    register: UseFormRegister<TourFormValues>;
    control: Control<TourFormValues>;
}

export function TourItinerary({ register, control }: TourItineraryProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "itinerary.days",
        keyName: "key" // Use 'key' to avoid conflict with 'id' if present in data
    });

    return (
        <div className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-white font-medium">Daily Itinerary</h3>
                <LiquidButton
                    type="button"
                    size="sm"
                    onClick={() => append({ dayNumber: fields.length + 1, title: { es: '', en: '' }, activities: [] })}
                    data-testid="add-day-button"
                >
                    <Plus size={16} /> Add Day
                </LiquidButton>
            </div>

            <div className="space-y-6">
                {fields.map((field, index) => (
                    <ItineraryDay
                        key={field.key}
                        dayIndex={index}
                        control={control}
                        register={register}
                        removeDay={remove}
                    />
                ))}

                {fields.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl text-white/40 bg-white/5">
                        <p>No days added to the itinerary yet.</p>
                        <LiquidButton
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => append({ dayNumber: 1, title: { es: '', en: '' }, activities: [] })}
                            className="mt-4"
                            data-testid="start-itinerary-button"
                        >
                            Start Itinerary
                        </LiquidButton>
                    </div>
                )}
            </div>
        </div>
    );
}
