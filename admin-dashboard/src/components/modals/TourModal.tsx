import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api, endpoints } from '../../lib/api';
import { LiquidButton } from '../ui/LiquidButton';
import type { Tour } from '../../types';

// Schema
const tourSchema = z.object({
    name: z.object({ es: z.string().min(1), en: z.string().min(1) }),
    description: z.object({ es: z.string().min(1), en: z.string().min(1) }),
    isActive: z.boolean(),
    type: z.enum(['multi-day', 'single-day']),
    totalDays: z.number().min(1),
    difficulty: z.string().min(1),
    pricingTiers: z.array(z.object({
        minPax: z.number(),
        maxPax: z.number(),
        priceCOP: z.number(),
        priceUSD: z.number()
    })).length(4),
});

type TourFormValues = z.infer<typeof tourSchema>;

interface TourModalProps {
    isOpen: boolean;
    onClose: () => void;
    tourId?: string;
}

export function TourModal({ isOpen, onClose, tourId }: TourModalProps) {
    const queryClient = useQueryClient();

    const { register, control, handleSubmit, reset, formState: { errors } } = useForm<TourFormValues>({
        resolver: zodResolver(tourSchema),
        defaultValues: {
            isActive: true,
            type: 'multi-day',
            totalDays: 1,
            pricingTiers: [
                { minPax: 1, maxPax: 1, priceCOP: 0, priceUSD: 0 },
                { minPax: 2, maxPax: 2, priceCOP: 0, priceUSD: 0 },
                { minPax: 3, maxPax: 3, priceCOP: 0, priceUSD: 0 },
                { minPax: 4, maxPax: 8, priceCOP: 0, priceUSD: 0 }
            ],
            name: { es: '', en: '' },
            description: { es: '', en: '' },
            difficulty: 'Medium'
        }
    });

    const { fields: pricingFields } = useFieldArray({
        control,
        name: "pricingTiers"
    });

    // Fetch tour if editing
    const { data: tour } = useQuery({
        queryKey: ['tour', tourId],
        queryFn: async () => {
            if (!tourId) return null;
            const { data } = await api.get<Tour>(endpoints.admin.tour(tourId));
            return data;
        },
        enabled: !!tourId
    });

    useEffect(() => {
        if (tour) {
            reset(tour as any);
        } else if (!tourId) {
            reset({
                isActive: true,
                type: 'multi-day',
                totalDays: 1,
                pricingTiers: [
                    { minPax: 1, maxPax: 1, priceCOP: 0, priceUSD: 0 },
                    { minPax: 2, maxPax: 2, priceCOP: 0, priceUSD: 0 },
                    { minPax: 3, maxPax: 3, priceCOP: 0, priceUSD: 0 },
                    { minPax: 4, maxPax: 8, priceCOP: 0, priceUSD: 0 }
                ],
                name: { es: '', en: '' },
                description: { es: '', en: '' },
                difficulty: 'Medium'
            });
        }
    }, [tour, tourId, reset]);

    const mutation = useMutation({
        mutationFn: async (data: TourFormValues) => {
            if (tourId) {
                return api.put(endpoints.admin.tour(tourId), data);
            }
            return api.post(endpoints.admin.tours, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            onClose();
        }
    });

    const onSubmit = (data: TourFormValues) => {
        mutation.mutate(data);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                    <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                        <Dialog.Title className="text-xl font-bold text-white">
                            {tourId ? 'Edit Tour' : 'New Tour'}
                        </Dialog.Title>
                        <Dialog.Close className="text-white/60 hover:text-white transition-colors">
                            <X size={24} />
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
                        <Tabs.Root defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 border-b border-white/10">
                                <Tabs.List className="flex gap-6">
                                    <Tabs.Trigger value="basic" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors">
                                        Basic Info
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="pricing" className="py-4 text-sm font-medium text-white/60 hover:text-white data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 transition-colors">
                                        Pricing
                                    </Tabs.Trigger>
                                </Tabs.List>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <Tabs.Content value="basic" className="space-y-6 outline-none">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Name (ES)</label>
                                            <input {...register('name.es')} className="glass-input w-full" placeholder="Nombre del tour" />
                                            {errors.name?.es && <span className="text-rose-400 text-xs">{errors.name.es.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Name (EN)</label>
                                            <input {...register('name.en')} className="glass-input w-full" placeholder="Tour Name" />
                                            {errors.name?.en && <span className="text-rose-400 text-xs">{errors.name.en.message}</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Description (ES)</label>
                                            <textarea {...register('description.es')} className="glass-input w-full h-24 resize-none" placeholder="Descripción..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Description (EN)</label>
                                            <textarea {...register('description.en')} className="glass-input w-full h-24 resize-none" placeholder="Description..." />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Type</label>
                                            <select {...register('type')} className="glass-input w-full">
                                                <option value="multi-day">Multi-Day</option>
                                                <option value="single-day">Single-Day</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Total Days</label>
                                            <input type="number" {...register('totalDays', { valueAsNumber: true })} className="glass-input w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-white/60 text-sm">Difficulty</label>
                                            <input {...register('difficulty')} className="glass-input w-full" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" {...register('isActive')} id="isActive" className="w-4 h-4 rounded border-white/20 bg-white/5" />
                                        <label htmlFor="isActive" className="text-white">Active (Visible to Public)</label>
                                    </div>
                                </Tabs.Content>

                                <Tabs.Content value="pricing" className="space-y-6 outline-none">
                                    <div className="space-y-4">
                                        <h3 className="text-white font-medium">Pricing Tiers</h3>
                                        <div className="grid grid-cols-5 gap-4 text-sm text-white/60 mb-2">
                                            <div>Min Pax</div>
                                            <div>Max Pax</div>
                                            <div>Price COP</div>
                                            <div>Price USD</div>
                                        </div>
                                        {pricingFields.map((field, index) => (
                                            <div key={field.id} className="grid grid-cols-5 gap-4">
                                                <input
                                                    type="number"
                                                    {...register(`pricingTiers.${index}.minPax`, { valueAsNumber: true })}
                                                    className="glass-input w-full"
                                                    readOnly // Fixed structure
                                                />
                                                <input
                                                    type="number"
                                                    {...register(`pricingTiers.${index}.maxPax`, { valueAsNumber: true })}
                                                    className="glass-input w-full"
                                                    readOnly // Fixed structure
                                                />
                                                <input
                                                    type="number"
                                                    {...register(`pricingTiers.${index}.priceCOP`, { valueAsNumber: true })}
                                                    className="glass-input w-full"
                                                    placeholder="COP"
                                                />
                                                <input
                                                    type="number"
                                                    {...register(`pricingTiers.${index}.priceUSD`, { valueAsNumber: true })}
                                                    className="glass-input w-full"
                                                    placeholder="USD"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </Tabs.Content>
                            </div>

                            <div className="p-6 border-t border-white/10 flex justify-end gap-3 shrink-0">
                                <LiquidButton type="button" variant="ghost" onClick={onClose}>Cancel</LiquidButton>
                                <LiquidButton type="submit" isLoading={mutation.isPending}>
                                    {tourId ? 'Update Tour' : 'Create Tour'}
                                </LiquidButton>
                            </div>
                        </Tabs.Root>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
