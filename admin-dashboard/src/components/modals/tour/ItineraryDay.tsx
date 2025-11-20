import { useFieldArray, type Control, type UseFormRegister } from 'react-hook-form';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { LiquidButton } from '../../ui/LiquidButton';

interface ItineraryDayProps {
    dayIndex: number;
    control: Control<any>;
    register: UseFormRegister<any>;
    removeDay: (index: number) => void;
}

export function ItineraryDay({ dayIndex, control, register, removeDay }: ItineraryDayProps) {
    const { fields: activityFields, append: appendActivity, remove: removeActivity } = useFieldArray({
        control,
        name: `itinerary.days.${dayIndex}.activities`
    });

    return (
        <div className="glass-panel p-4 rounded-xl space-y-4 border border-white/5">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/20 rounded text-indigo-300">
                        <span className="font-bold text-sm">Day {dayIndex + 1}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => removeDay(dayIndex)}
                    className="text-white/40 hover:text-rose-400 transition-colors p-1 hover:bg-white/5 rounded"
                    title="Remove Day"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-white/40 ml-1">Title (ES)</label>
                    <input
                        {...register(`itinerary.days.${dayIndex}.title.es`)}
                        className="glass-input w-full text-sm"
                        placeholder="Título del día"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-white/40 ml-1">Title (EN)</label>
                    <input
                        {...register(`itinerary.days.${dayIndex}.title.en`)}
                        className="glass-input w-full text-sm"
                        placeholder="Day Title"
                    />
                </div>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-white/5">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Activities</span>
                    <LiquidButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => appendActivity({ es: '', en: '' })}
                        className="h-6 text-xs px-2"
                    >
                        <Plus size={12} /> Add Activity
                    </LiquidButton>
                </div>

                <div className="space-y-2">
                    {activityFields.map((field, actIndex) => (
                        <div key={field.id} className="flex gap-2 items-start group">
                            <GripVertical size={14} className="text-white/10 mt-3 shrink-0" />
                            <div className="grid grid-cols-2 gap-2 flex-1">
                                <textarea
                                    {...register(`itinerary.days.${dayIndex}.activities.${actIndex}.es`)}
                                    className="glass-input w-full text-xs min-h-[2.5rem] resize-y"
                                    placeholder="Actividad (ES)"
                                    rows={1}
                                />
                                <textarea
                                    {...register(`itinerary.days.${dayIndex}.activities.${actIndex}.en`)}
                                    className="glass-input w-full text-xs min-h-[2.5rem] resize-y"
                                    placeholder="Activity (EN)"
                                    rows={1}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeActivity(actIndex)}
                                className="text-white/20 hover:text-rose-400 transition-colors p-1 mt-1 opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {activityFields.length === 0 && (
                        <div className="text-xs text-white/20 italic py-2 text-center border border-dashed border-white/10 rounded">
                            No activities added yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
