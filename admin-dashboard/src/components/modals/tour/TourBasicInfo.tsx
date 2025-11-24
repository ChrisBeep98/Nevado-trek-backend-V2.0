import type { UseFormRegister, FieldErrors, Control } from 'react-hook-form';
import type { TourFormValues } from '../TourModal';

interface TourBasicInfoProps {
    register: UseFormRegister<TourFormValues>;
    errors: FieldErrors<TourFormValues>;
    control: Control<TourFormValues>;
}

export function TourBasicInfo({ register, errors }: TourBasicInfoProps) {
    return (
        <div className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-white/60 text-sm">Name (ES)</label>
                    <input
                        data-testid="input-name-es"
                        {...register('name.es')}
                        className="glass-input w-full"
                        placeholder="Nombre del tour"
                    />
                    {errors.name?.es && <span className="text-rose-400 text-xs">{errors.name.es.message}</span>}
                </div>
                <div className="space-y-2">
                    <label className="text-white/60 text-sm">Name (EN)</label>
                    <input
                        data-testid="input-name-en"
                        {...register('name.en')}
                        className="glass-input w-full"
                        placeholder="Tour Name"
                    />
                    {errors.name?.en && <span className="text-rose-400 text-xs">{errors.name.en.message}</span>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-white/60 text-sm">Description (ES)</label>
                    <textarea
                        {...register('description.es')}
                        className="glass-input w-full h-24 resize-none"
                        placeholder="Descripción..."
                    />
                    {errors.description?.es && <span className="text-rose-400 text-xs">{errors.description.es.message}</span>}
                </div>
                <div className="space-y-2">
                    <label className="text-white/60 text-sm">Description (EN)</label>
                    <textarea
                        {...register('description.en')}
                        className="glass-input w-full h-24 resize-none"
                        placeholder="Description..."
                    />
                    {errors.description?.en && <span className="text-rose-400 text-xs">{errors.description.en.message}</span>}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-white/60 text-sm">Type</label>
                    <select {...register('type')} className="glass-input w-full" data-testid="select-type">
                        <option value="multi-day">Multi-Day</option>
                        <option value="single-day">Single-Day</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-white/60 text-sm">Total Days</label>
                    <input
                        type="number"
                        {...register('totalDays', { valueAsNumber: true })}
                        className="glass-input w-full"
                        data-testid="input-total-days"
                    />
                    {errors.totalDays && <span className="text-rose-400 text-xs">{errors.totalDays.message}</span>}
                </div>
                <div className="space-y-2">
                    <label className="text-white/60 text-sm">Difficulty</label>
                    <select {...register('difficulty')} className="glass-input w-full" data-testid="input-difficulty">
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Expert">Expert</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <input
                    type="checkbox"
                    {...register('isActive')}
                    id="isActive"
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <label htmlFor="isActive" className="text-white font-medium cursor-pointer select-none">
                    Active (Visible to Public)
                </label>
            </div>
        </div>
    );
}
